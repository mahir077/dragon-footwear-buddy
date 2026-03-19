import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

const JournalEntryPage = () => {
  const qc = useQueryClient();
  const now = new Date();

  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([
    { account_id: "", debit: "", credit: "", note: "" },
    { account_id: "", debit: "", credit: "", note: "" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  // Filter
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));

  const startDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

  const { data: accounts = [] } = useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").eq("is_active", true).eq("is_group", false).order("code");
      return data || [];
    },
  });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ["journal_entries", monthFilter, yearFilter],
    queryFn: async () => {
      const { data } = await db.from("journal_entries")
        .select("*")
        .eq("is_manual", true)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: viewLines = [] } = useQuery({
    queryKey: ["journal_lines", viewId],
    queryFn: async () => {
      if (!viewId) return [];
      const { data } = await db.from("journal_lines")
        .select("*, chart_of_accounts(code, name_bn)")
        .eq("journal_id", viewId);
      return data || [];
    },
    enabled: !!viewId,
  });

  const addLine = () => setLines([...lines, { account_id: "", debit: "", credit: "", note: "" }]);

  const removeLine = (i: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, idx) => idx !== i));
  };

  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    // Debit দিলে credit clear, credit দিলে debit clear
    if (field === "debit" && value) updated[i].credit = "";
    if (field === "credit" && value) updated[i].debit = "";
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!narration.trim()) throw new Error("বিবরণ দিন");
      if (!isBalanced) throw new Error(`Debit (৳${totalDebit}) ≠ Credit (৳${totalCredit}) — মিলছে না!`);

      const validLines = lines.filter(l => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
      if (validLines.length < 2) throw new Error("কমপক্ষে ২টি line দিন");

      // Insert journal entry
      const { data: journal, error: je } = await db.from("journal_entries").insert({
        date,
        narration,
        source_module: "manual",
        is_manual: true,
        year_id: activeYear?.id || null,
      }).select().single();
      if (je) throw je;

      // Insert journal lines
      const { error: jl } = await db.from("journal_lines").insert(
        validLines.map(l => ({
          journal_id: journal.id,
          account_id: l.account_id,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          note: l.note || null,
        }))
      );
      if (jl) throw jl;
    },
    onSuccess: () => {
      toast.success("জার্নাল সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      setNarration("");
      setLines([
        { account_id: "", debit: "", credit: "", note: "" },
        { account_id: "", debit: "", credit: "", note: "" },
      ]);
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await db.from("journal_lines").delete().eq("journal_id", id);
      const { error } = await db.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">জার্নাল এন্ট্রি</h1>
          <p className="text-xs text-muted-foreground">Journal Entry (Manual)</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span className="font-bengali">নতুন জার্নাল</span>
          </Button>
        )}
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
          <h2 className="font-bengali font-semibold">নতুন জার্নাল এন্ট্রি</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="font-bengali text-xs">তারিখ *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="font-bengali text-xs">বিবরণ (Narration) *</Label>
              <Input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="যেমন: মাসিক বেতন পরিশোধ"
                className="font-bengali"
              />
            </div>
          </div>

          {/* Journal Lines */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="font-bengali">
                  <th className="p-2 text-left">হিসাব</th>
                  <th className="p-2 text-right w-32">ডেবিট (Dr)</th>
                  <th className="p-2 text-right w-32">ক্রেডিট (Cr)</th>
                  <th className="p-2 text-left w-32">নোট</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1.5">
                      <select
                        value={line.account_id}
                        onChange={(e) => updateLine(i, "account_id", e.target.value)}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm font-bengali"
                      >
                        <option value="">হিসাব নির্বাচন</option>
                        {accounts.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name_bn}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="number"
                        value={line.debit}
                        onChange={(e) => updateLine(i, "debit", e.target.value)}
                        className="text-right"
                        placeholder="০"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="number"
                        value={line.credit}
                        onChange={(e) => updateLine(i, "credit", e.target.value)}
                        className="text-right"
                        placeholder="০"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={line.note}
                        onChange={(e) => updateLine(i, "note", e.target.value)}
                        placeholder="ঐচ্ছিক"
                        className="text-sm"
                      />
                    </td>
                    <td className="p-1.5">
                      <button onClick={() => removeLine(i)} className="text-destructive hover:opacity-70">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted font-bold">
                <tr>
                  <td className="p-2 font-bengali text-sm">মোট</td>
                  <td className={`p-2 text-right text-sm ${!isBalanced && totalDebit > 0 ? "text-destructive" : "text-green-600"}`}>
                    ৳{totalDebit.toLocaleString()}
                  </td>
                  <td className={`p-2 text-right text-sm ${!isBalanced && totalCredit > 0 ? "text-destructive" : "text-green-600"}`}>
                    ৳{totalCredit.toLocaleString()}
                  </td>
                  <td colSpan={2} className="p-2 text-sm">
                    {isBalanced ? (
                      <span className="text-green-600 font-bengali">✅ মিলেছে</span>
                    ) : totalDebit > 0 || totalCredit > 0 ? (
                      <span className="text-destructive font-bengali">❌ মিলছে না</span>
                    ) : null}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={addLine} className="gap-1.5 font-bengali text-sm">
              <Plus className="w-3.5 h-3.5" /> লাইন যোগ করুন
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !isBalanced}
              className="bg-green-600 hover:bg-green-700 font-bengali"
            >
              সংরক্ষণ করুন
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="font-bengali">বাতিল</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">মাস</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বছর</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Journal List */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">বিবরণ</TableHead>
              <TableHead className="font-bengali">ধরন</TableHead>
              <TableHead className="text-center font-bengali">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8 text-muted-foreground">কোনো জার্নাল নেই</TableCell></TableRow>
            ) : journals.map((j: any) => (
              <>
                <TableRow key={j.id}>
                  <TableCell className="text-xs">{j.date}</TableCell>
                  <TableCell className="font-bengali text-sm">{j.narration || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={j.is_manual ? "outline" : "secondary"} className="text-xs font-bengali">
                      {j.is_manual ? "ম্যানুয়াল" : j.source_module}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {deleteId === j.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bengali text-destructive">মুছবো?</span>
                        <button onClick={() => deleteMut.mutate(j.id)}
                          className="p-1 rounded bg-destructive text-white hover:opacity-80">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          className="p-1 rounded bg-muted hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewId(viewId === j.id ? null : j.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {j.is_manual && (
                          <button onClick={() => setDeleteId(j.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>

                {/* Expanded view */}
                {viewId === j.id && (
                  <TableRow key={`${j.id}-lines`}>
                    <TableCell colSpan={4} className="bg-muted/30 p-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="font-bengali border-b">
                            <th className="text-left p-1">হিসাব</th>
                            <th className="text-right p-1">ডেবিট</th>
                            <th className="text-right p-1">ক্রেডিট</th>
                            <th className="text-left p-1">নোট</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewLines.map((l: any) => (
                            <tr key={l.id} className="border-b">
                              <td className="p-1 font-bengali">{l.chart_of_accounts?.code} — {l.chart_of_accounts?.name_bn}</td>
                              <td className="p-1 text-right text-green-700">{l.debit > 0 ? `৳${l.debit.toLocaleString()}` : "—"}</td>
                              <td className="p-1 text-right text-red-700">{l.credit > 0 ? `৳${l.credit.toLocaleString()}` : "—"}</td>
                              <td className="p-1 font-bengali">{l.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default JournalEntryPage;