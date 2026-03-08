import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const txTypes = [
  { key: "income", bn: "আয়", en: "Income", emoji: "🟢", color: "hsl(var(--stat-green))" },
  { key: "expense", bn: "ব্যয়", en: "Expense", emoji: "🔴", color: "hsl(var(--stat-red))" },
  { key: "cash_receive", bn: "নগদ পেলাম", en: "Cash Received", emoji: "🔵", color: "hsl(var(--stat-blue))" },
  { key: "cash_payment", bn: "নগদ দিলাম", en: "Cash Payment", emoji: "🟠", color: "hsl(var(--stat-orange))" },
  { key: "bank_deposit", bn: "ব্যাংকে জমা", en: "Bank Deposit", emoji: "🟣", color: "hsl(var(--stat-purple))" },
  { key: "bank_withdrawal", bn: "ব্যাংক থেকে তুললাম", en: "Bank Withdrawal", emoji: "⚫", color: "hsl(var(--foreground))" },
];

const KhataEntryPage = () => {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bankId, setBankId] = useState("");
  const [incomeHeadId, setIncomeHeadId] = useState("");
  const [expenseHeadId, setExpenseHeadId] = useState("");

  const { data: activeYear } = useQuery({
    queryKey: ["active_financial_year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["bank_accounts_active"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: incomeHeads = [] } = useQuery({
    queryKey: ["income_heads"],
    queryFn: async () => {
      const { data } = await supabase.from("income_heads").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: expenseHeads = [] } = useQuery({
    queryKey: ["expense_heads"],
    queryFn: async () => {
      const { data } = await supabase.from("expense_heads").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: todayTotals } = useQuery({
    queryKey: ["today_totals", date],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("type, amount").eq("date", date);
      if (!data) return { income: 0, expense: 0 };
      let income = 0, expense = 0;
      data.forEach((t) => {
        if (t.type === "income" || t.type === "cash_receive") income += Number(t.amount);
        if (t.type === "expense" || t.type === "cash_payment") expense += Number(t.amount);
      });
      return { income, expense, balance: income - expense };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const row: any = {
        date, type: selectedType, amount: Number(amount), note: note || null,
        year_id: activeYear?.id || null,
      };
      if (selectedType === "bank_deposit" || selectedType === "bank_withdrawal") row.bank_id = bankId || null;
      if (selectedType === "income") row.income_head_id = incomeHeadId || null;
      if (selectedType === "expense") row.expense_head_id = expenseHeadId || null;
      const { error } = await supabase.from("daily_transactions").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today_totals"] });
      setAmount(""); setNote(""); setSelectedType(null);
      toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" });
    },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const isBank = selectedType === "bank_deposit" || selectedType === "bank_withdrawal";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-bengali">দৈনিক এন্ট্রি</h1>
        <p className="text-sm text-muted-foreground">Daily Entry</p>
      </div>

      {/* Date picker */}
      <div>
        <label className="font-bengali text-lg font-medium block mb-2">তারিখ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full border-2 border-primary rounded-xl px-5 py-4 text-xl font-bold text-center" />
      </div>

      {/* Type buttons */}
      {!selectedType && (
        <div className="space-y-3">
          <p className="font-bengali text-lg font-medium">ধরন নির্বাচন করুন</p>
          {txTypes.map((t) => (
            <button key={t.key} onClick={() => setSelectedType(t.key)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all hover:shadow-md active:scale-[0.98]"
              style={{ borderColor: t.color }}>
              <span className="text-3xl">{t.emoji}</span>
              <div>
                <div className="text-xl font-bold font-bengali" style={{ color: t.color }}>{t.bn}</div>
                <div className="text-sm text-muted-foreground">{t.en}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Entry form */}
      {selectedType && (
        <div className="space-y-4 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{txTypes.find(t => t.key === selectedType)?.emoji}</span>
              <span className="text-xl font-bold font-bengali" style={{ color: txTypes.find(t => t.key === selectedType)?.color }}>
                {txTypes.find(t => t.key === selectedType)?.bn}
              </span>
            </div>
            <button onClick={() => setSelectedType(null)} className="text-sm font-bengali text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg bg-muted">পরিবর্তন</button>
          </div>

          <div>
            <label className="font-bengali text-base font-medium block mb-1">পরিমাণ (টাকা)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="০"
              className="w-full border-2 rounded-xl px-5 py-5 text-3xl font-bold text-center" autoFocus />
          </div>

          {selectedType === "income" && (
            <div>
              <label className="font-bengali text-base font-medium block mb-1">আয়ের খাত</label>
              <select className="w-full border rounded-xl px-4 py-3 text-base" value={incomeHeadId} onChange={(e) => setIncomeHeadId(e.target.value)}>
                <option value="">নির্বাচন করুন</option>
                {incomeHeads.map((h) => <option key={h.id} value={h.id}>{h.name_bn}</option>)}
              </select>
            </div>
          )}

          {selectedType === "expense" && (
            <div>
              <label className="font-bengali text-base font-medium block mb-1">ব্যয়ের খাত</label>
              <select className="w-full border rounded-xl px-4 py-3 text-base" value={expenseHeadId} onChange={(e) => setExpenseHeadId(e.target.value)}>
                <option value="">নির্বাচন করুন</option>
                {expenseHeads.map((h) => <option key={h.id} value={h.id}>{h.name_bn}</option>)}
              </select>
            </div>
          )}

          {isBank && (
            <div>
              <label className="font-bengali text-base font-medium block mb-1">ব্যাংক</label>
              <select className="w-full border rounded-xl px-4 py-3 text-base" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                <option value="">নির্বাচন করুন</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_no}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="font-bengali text-base font-medium block mb-1">নোট</label>
            <input className="w-full border rounded-xl px-4 py-3 text-base" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক" />
          </div>

          <button onClick={() => saveMutation.mutate()} disabled={!amount || Number(amount) <= 0 || saveMutation.isPending}
            className="w-full bg-[hsl(var(--stat-green))] text-white px-6 py-4 rounded-xl text-xl font-bengali font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </button>
        </div>
      )}

      {/* Today's summary */}
      {todayTotals && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[hsl(var(--stat-green))]/10 rounded-xl p-4 text-center">
            <p className="text-sm font-bengali text-[hsl(var(--stat-green))]">মোট আয়</p>
            <p className="text-lg font-bold text-[hsl(var(--stat-green))]">৳{todayTotals.income.toLocaleString()}</p>
          </div>
          <div className="bg-[hsl(var(--stat-red))]/10 rounded-xl p-4 text-center">
            <p className="text-sm font-bengali text-[hsl(var(--stat-red))]">মোট ব্যয়</p>
            <p className="text-lg font-bold text-[hsl(var(--stat-red))]">৳{todayTotals.expense.toLocaleString()}</p>
          </div>
          <div className="bg-[hsl(var(--stat-blue))]/10 rounded-xl p-4 text-center">
            <p className="text-sm font-bengali text-[hsl(var(--stat-blue))]">ব্যালেন্স</p>
            <p className="text-lg font-bold text-[hsl(var(--stat-blue))]">৳{(todayTotals.balance ?? 0).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhataEntryPage;
