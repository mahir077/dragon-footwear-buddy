import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Check, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// ✅ Helper — type-safe supabase wrapper for new tables
const db = supabase as any;

const typeLabels: Record<string, { bn: string; color: string }> = {
  asset:     { bn: "সম্পদ",    color: "bg-blue-100 text-blue-700" },
  liability: { bn: "দায়",     color: "bg-red-100 text-red-700" },
  capital:   { bn: "মূলধন",   color: "bg-purple-100 text-purple-700" },
  income:    { bn: "আয়",      color: "bg-green-100 text-green-700" },
  expense:   { bn: "ব্যয়",    color: "bg-orange-100 text-orange-700" },
};

const ChartOfAccountsPage = () => {
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState("all");

  // Form state
  const [code, setCode] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [accountType, setAccountType] = useState("asset");
  const [parentId, setParentId] = useState("");
  const [isGroup, setIsGroup] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").order("code");
      return data || [];
    },
  });

  const resetForm = () => {
    setCode(""); setNameBn(""); setNameEn("");
    setAccountType("asset"); setParentId(""); setIsGroup(false);
    setEditId(null); setShowForm(false);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error("কোড দিন");
      if (!nameBn.trim()) throw new Error("নাম দিন");

      const payload = {
        code,
        name_bn: nameBn,
        name_en: nameEn || null,
        account_type: accountType,
        parent_id: parentId || null,
        is_group: isGroup,
      };

      if (editId) {
        const { error } = await db.from("chart_of_accounts").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await db.from("chart_of_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "আপডেট হয়েছে ✅" : "যোগ করা হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("chart_of_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (a: any) => {
    setEditId(a.id);
    setCode(a.code || "");
    setNameBn(a.name_bn || "");
    setNameEn(a.name_en || "");
    setAccountType(a.account_type || "asset");
    setParentId(a.parent_id || "");
    setIsGroup(a.is_group || false);
    setShowForm(true);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter & organize
  const filtered = filterType === "all" ? accounts : accounts.filter((a: any) => a.account_type === filterType);
  const topLevel = filtered.filter((a: any) => !a.parent_id);
  const getChildren = (pid: string) => filtered.filter((a: any) => a.parent_id === pid);
  const groupAccounts = accounts.filter((a: any) => a.is_group);

  const renderRow = (a: any, depth = 0) => {
    const children = getChildren(a.id);
    const isExpanded = expandedGroups[a.id] !== false;
    const label = typeLabels[a.account_type] || { bn: a.account_type, color: "" };

    return (
      <div key={a.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 border-b hover:bg-muted/30 transition-colors ${depth > 0 ? "bg-muted/10" : ""}`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {a.is_group ? (
            <button onClick={() => toggleGroup(a.id)} className="text-muted-foreground shrink-0">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 inline-block shrink-0" />
          )}

          <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">{a.code}</span>
          <span className={`flex-1 font-bengali text-sm ${a.is_group ? "font-bold" : ""}`}>{a.name_bn}</span>
          {a.name_en && <span className="text-xs text-muted-foreground hidden md:inline mr-2">{a.name_en}</span>}

          <Badge className={`text-xs font-bengali shrink-0 ${label.color} border-0`}>{label.bn}</Badge>
          {a.is_group && <Badge variant="outline" className="text-xs shrink-0">গ্রুপ</Badge>}

          {deleteId === a.id ? (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-bengali text-destructive">মুছবো?</span>
              <button onClick={() => deleteMut.mutate(a.id)}
                className="p-1 rounded bg-destructive text-white hover:opacity-80">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setDeleteId(null)}
                className="p-1 rounded bg-muted hover:opacity-80">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(a)}
                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!a.is_group && (
                <button onClick={() => setDeleteId(a.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {a.is_group && isExpanded && children.map((child: any) => renderRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">হিসাবের তালিকা</h1>
          <p className="text-xs text-muted-foreground">Chart of Accounts</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span className="font-bengali">নতুন যোগ করুন</span>
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-xl p-4 mb-4 bg-muted/30 space-y-3">
          <h2 className="font-bengali font-semibold text-sm">
            {editId ? "হিসাব সম্পাদনা" : "নতুন হিসাব"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="font-bengali text-xs">কোড *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="যেমন: 1101" />
            </div>
            <div>
              <Label className="font-bengali text-xs">নাম (বাংলা) *</Label>
              <Input value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder="যেমন: হাতে নগদ" className="font-bengali" />
            </div>
            <div>
              <Label className="font-bengali text-xs">নাম (English)</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Cash in Hand" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="font-bengali text-xs">ধরন *</Label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm font-bengali">
                <option value="asset">সম্পদ (Asset)</option>
                <option value="liability">দায় (Liability)</option>
                <option value="capital">মূলধন (Capital)</option>
                <option value="income">আয় (Income)</option>
                <option value="expense">ব্যয় (Expense)</option>
              </select>
            </div>
            <div>
              <Label className="font-bengali text-xs">Parent Group</Label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm font-bengali">
                <option value="">কোনো parent নেই</option>
                {groupAccounts.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.code} — {g.name_bn}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="isGroup" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)}
                className="w-4 h-4" />
              <Label htmlFor="isGroup" className="font-bengali text-sm cursor-pointer">এটি একটি গ্রুপ</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="bg-green-600 hover:bg-green-700 font-bengali">
              {editId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-bengali">বাতিল</Button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {["all", "asset", "liability", "capital", "income", "expense"].map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bengali transition-colors ${filterType === t ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}>
            {t === "all" ? "সব" : typeLabels[t]?.bn}
          </button>
        ))}
      </div>

      {/* Account tree */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted font-bold text-xs border-b">
          <span className="w-3.5" />
          <span className="w-12 font-mono">কোড</span>
          <span className="flex-1 font-bengali">নাম</span>
          <span className="font-bengali">ধরন</span>
          <span className="w-20 text-center font-bengali">অ্যাকশন</span>
        </div>

        {isLoading ? (
          <div className="text-center font-bengali py-8 text-muted-foreground">লোড হচ্ছে...</div>
        ) : topLevel.length === 0 ? (
          <div className="text-center font-bengali py-8 text-muted-foreground">কোনো হিসাব নেই</div>
        ) : (
          topLevel.map((a: any) => renderRow(a, 0))
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 font-bengali">
        মোট {accounts.length} টি হিসাব
      </p>
    </div>
  );
};

export default ChartOfAccountsPage;