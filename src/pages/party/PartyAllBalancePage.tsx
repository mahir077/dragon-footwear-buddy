import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { MoreVertical, Eye, DollarSign, ArrowDownCircle, ArrowUpCircle, Gift, Pencil, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";

const PartyAllBalancePage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Quick payment modal
  const [modal, setModal] = useState<{ partyId: string; partyName: string; type: "receipt" | "payment" | "advance" | "dismiss" } | null>(null);
  const [modalAmount, setModalAmount] = useState(0);
  const [modalNote, setModalNote] = useState("");
  const [modalMode, setModalMode] = useState("cash");

  const { data: balances = [] } = useQuery({
    queryKey: ["all-party-balances"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("v_party_balance").select("*").order("name");
      return data || [];
    },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties-full"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: years } = useQuery({
    queryKey: ["active-year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const merged = parties.map((p: any) => {
    const bal = balances.find((b: any) => b.party_id === p.id);
    return { ...p, ...(bal || {}), current_balance: bal?.current_balance || 0 };
  });

  const filtered = merged.filter((p: any) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalReceivable = filtered.filter((p: any) => p.current_balance > 0).reduce((s: number, p: any) => s + p.current_balance, 0);
  const totalPayable = filtered.filter((p: any) => p.current_balance < 0).reduce((s: number, p: any) => s + Math.abs(p.current_balance), 0);

  const openModal = (partyId: string, partyName: string, type: "receipt" | "payment" | "advance" | "dismiss", currentBalance: number) => {
    setModal({ partyId, partyName, type });
    // ✅ dismiss হলে current balance auto-fill করো
    setModalAmount(type === "dismiss" ? Math.abs(currentBalance) : 0);
    setModalNote("");
    setOpenMenu(null);
  };

  const quickActionMutation = useMutation({
    mutationFn: async () => {
      if (!modal || !modalAmount || modalAmount <= 0) throw new Error("সঠিক পরিমাণ দিন");

      // ✅ Fixed: dismiss আলাদাভাবে handle
      const paymentType = modal.type === "payment" ? "payment"
        : modal.type === "dismiss" ? "dismiss"
        : "receipt";

      await (supabase as any).from("party_payments").insert({
        date: format(new Date(), "yyyy-MM-dd"),
        party_id: modal.partyId,
        type: paymentType,
        amount: modalAmount,
        payment_mode: modalMode,
        note: modalNote || modal.type,
        year_id: years?.id || null,
      });

      await supabase.from("daily_transactions").insert({
        date: format(new Date(), "yyyy-MM-dd"),
        type: modal.type === "payment" ? "expense" : "income",
        amount: modalAmount,
        note: `${modal.type === "receipt" ? "আদায়" : modal.type === "payment" ? "প্রদান" : modal.type === "advance" ? "অগ্রিম" : "মাফ"} - ${modal.partyName}${modalNote ? " | " + modalNote : ""}`,
        year_id: years?.id || null,
      });
    },
    onSuccess: () => {
      toast({ title: "সফল ✅" });
      qc.invalidateQueries({ queryKey: ["all-party-balances"] });
      setModal(null);
      setModalAmount(0);
      setModalNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parties").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties-full"] });
      setDeleteId(null);
      toast({ title: "পার্টি নিষ্ক্রিয় করা হয়েছে" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const modalConfig = {
    receipt: { title: "💰 টাকা আদায়", color: "bg-green-600", label: "আদায়ের পরিমাণ" },
    payment: { title: "💸 টাকা প্রদান", color: "bg-red-600", label: "প্রদানের পরিমাণ" },
    advance: { title: "💵 অগ্রিম", color: "bg-blue-600", label: "অগ্রিম পরিমাণ" },
    dismiss: { title: "🧾 বাকি মাফ", color: "bg-orange-600", label: "মাফের পরিমাণ" },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold font-bengali">পার্টি ম্যানেজমেন্ট</h1>
        <p className="text-sm text-muted-foreground">Party Management — Balance & Actions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-600 text-white rounded-xl p-3">
          <p className="text-xs opacity-80 font-bengali">মোট পাওনা (আমাদের)</p>
          <p className="text-xl font-extrabold font-bengali">৳{totalReceivable.toLocaleString()}</p>
        </div>
        <div className="bg-red-600 text-white rounded-xl p-3">
          <p className="text-xs opacity-80 font-bengali">মোট দেনা (আমাদের)</p>
          <p className="text-xl font-extrabold font-bengali">৳{totalPayable.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input placeholder="নাম খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="font-bengali flex-1" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 font-bengali text-sm">
          <option value="all">সব</option>
          <option value="customer">কাস্টমার</option>
          <option value="supplier">সরবরাহকারী</option>
          <option value="both">উভয়</option>
        </select>
      </div>

      {/* Party Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="font-bengali">
              <th className="p-3 text-left">নাম</th>
              <th className="p-3 text-left">ধরন</th>
              <th className="p-3 text-right">মোট বিক্রি</th>
              <th className="p-3 text-right">মোট আদায়</th>
              <th className="p-3 text-right">বর্তমান বাকি</th>
              <th className="p-3 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center font-bengali text-muted-foreground">কোনো পার্টি নেই</td></tr>
            )}
            {filtered.map((p: any) => (
              <tr key={p.id} className={`border-t ${p.current_balance > 0 ? "bg-red-50 dark:bg-red-950/20" : p.current_balance < 0 ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}>
                <td className="p-3">
                  <p className="font-bold font-bengali">{p.name}</p>
                  {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bengali font-bold ${
                    p.type === "customer" ? "bg-green-100 text-green-700" :
                    p.type === "supplier" ? "bg-blue-100 text-blue-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {p.type === "customer" ? "কাস্টমার" : p.type === "supplier" ? "সরবরাহকারী" : "উভয়"}
                  </span>
                </td>
                <td className="p-3 text-right font-bengali">৳{(p.sales_due !== undefined ? (p.sales_due + (p.total_received || 0)) : 0).toLocaleString()}</td>
                <td className="p-3 text-right text-green-600 font-bold font-bengali">৳{(p.total_received || 0).toLocaleString()}</td>
                <td className={`p-3 text-right font-bold font-bengali ${p.current_balance > 0 ? "text-red-600" : p.current_balance < 0 ? "text-blue-600" : "text-green-600"}`}>
                  {p.current_balance > 0
                    ? (p.type === "supplier" ? "দেনা " : "পাওনা ")
                    : p.current_balance < 0
                    ? "অগ্রিম "
                    : "✓ "}
                  ৳{Math.abs(p.current_balance).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {deleteId === p.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bengali text-destructive">নিষ্ক্রিয়?</span>
                      <button onClick={() => deleteMutation.mutate(p.id)} className="p-1 rounded bg-destructive text-white"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteId(null)} className="p-1 rounded bg-muted"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-8 z-50 bg-card border rounded-xl shadow-xl w-44 py-1 text-left">
                          <button onClick={() => { navigate(`/party/ledger?party=${p.id}`); setOpenMenu(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                            <Eye className="w-4 h-4 text-blue-500" /> লেজার দেখুন
                          </button>
                          {(p.type === "customer" || p.type === "both") && (
                            <button onClick={() => openModal(p.id, p.name, "receipt", p.current_balance)}
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                              <ArrowDownCircle className="w-4 h-4 text-green-500" /> টাকা আদায়
                            </button>
                          )}
                          {(p.type === "supplier" || p.type === "both") && (
                            <button onClick={() => openModal(p.id, p.name, "payment", p.current_balance)}
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                              <ArrowUpCircle className="w-4 h-4 text-red-500" /> টাকা প্রদান
                            </button>
                          )}
                          <button onClick={() => openModal(p.id, p.name, "advance", p.current_balance)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                            <Gift className="w-4 h-4 text-blue-500" /> অগ্রিম
                          </button>
                          {/* ✅ dismiss — only show if balance > 0 */}
                          {p.current_balance > 0 && (
                            <button onClick={() => openModal(p.id, p.name, "dismiss", p.current_balance)}
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                              <DollarSign className="w-4 h-4 text-orange-500" /> বাকি মাফ
                            </button>
                          )}
                          <hr className="my-1" />
                          <button onClick={() => { navigate(`/setup/parties?edit=${p.id}`); setOpenMenu(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
                            <Pencil className="w-4 h-4 text-gray-500" /> এডিট
                          </button>
                          <button onClick={() => { setDeleteId(p.id); setOpenMenu(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-destructive font-bengali text-sm">
                            <Trash2 className="w-4 h-4" /> নিষ্ক্রিয় করুন
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Action Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-bengali">{modalConfig[modal.type].title}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm font-bengali text-muted-foreground">{modal.partyName}</p>
            <div>
              <label className="text-xs font-bengali text-muted-foreground">{modalConfig[modal.type].label} (৳)</label>
              <Input type="number" value={modalAmount || ""} onChange={e => setModalAmount(Number(e.target.value))}
                className="text-2xl font-bold h-14 mt-1" placeholder="০" autoFocus />
            </div>
            <div className="flex gap-2">
              {["cash", "bank", "mobile"].map(m => (
                <button key={m} onClick={() => setModalMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${modalMode === m ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {m === "cash" ? "নগদ" : m === "bank" ? "ব্যাংক" : "মোবাইল"}
                </button>
              ))}
            </div>
            <Input value={modalNote} onChange={e => setModalNote(e.target.value)}
              placeholder="নোট (ঐচ্ছিক)" className="font-bengali" />
            <button onClick={() => quickActionMutation.mutate()} disabled={quickActionMutation.isPending}
              className={`w-full py-3 rounded-xl text-white font-bold font-bengali text-lg ${modalConfig[modal.type].color}`}>
              {quickActionMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </div>
  );
};

export default PartyAllBalancePage;