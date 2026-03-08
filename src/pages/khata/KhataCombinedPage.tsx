import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KhataCombinedPage = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: summary } = useQuery({
    queryKey: ["combined_summary", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("type, amount")
        .gte("date", startDate).lte("date", endDate);
      if (!data) return { income: 0, expense: 0, bankDeposit: 0, bankWithdrawal: 0 };
      let income = 0, expense = 0, bankDeposit = 0, bankWithdrawal = 0;
      data.forEach((t) => {
        const amt = Number(t.amount);
        switch (t.type) {
          case "income": case "cash_receive": income += amt; break;
          case "expense": case "cash_payment": expense += amt; break;
          case "bank_deposit": bankDeposit += amt; break;
          case "bank_withdrawal": bankWithdrawal += amt; break;
        }
      });
      return { income, expense, bankDeposit, bankWithdrawal };
    },
  });

  const realBalance = (summary?.income || 0) - (summary?.expense || 0);
  // Remaining balance = (income + receivable) - (expense + payable). Placeholder: same as real for now.
  const remainingBalance = realBalance;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-bengali">সমন্বিত খাতা</h1>
        <p className="text-sm text-muted-foreground">Combined Ledger</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="font-bengali text-sm block mb-1">শুরু</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-base" />
        </div>
        <div>
          <label className="font-bengali text-sm block mb-1">শেষ</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-base" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--stat-green))]/10 border border-[hsl(var(--stat-green))]/30 rounded-xl p-5">
          <p className="font-bengali text-lg text-[hsl(var(--stat-green))]">মোট আয়</p>
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold text-[hsl(var(--stat-green))] mt-2">৳{(summary?.income || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-red))]/10 border border-[hsl(var(--stat-red))]/30 rounded-xl p-5">
          <p className="font-bengali text-lg text-[hsl(var(--stat-red))]">মোট ব্যয়</p>
          <p className="text-sm text-muted-foreground">Total Expense</p>
          <p className="text-2xl font-bold text-[hsl(var(--stat-red))] mt-2">৳{(summary?.expense || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-blue))]/10 border border-[hsl(var(--stat-blue))]/30 rounded-xl p-5">
          <p className="font-bengali text-lg text-[hsl(var(--stat-blue))]">ব্যাংকে জমা</p>
          <p className="text-sm text-muted-foreground">Bank Deposit</p>
          <p className="text-2xl font-bold text-[hsl(var(--stat-blue))] mt-2">৳{(summary?.bankDeposit || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-orange))]/10 border border-[hsl(var(--stat-orange))]/30 rounded-xl p-5">
          <p className="font-bengali text-lg text-[hsl(var(--stat-orange))]">ব্যাংক থেকে তোলা</p>
          <p className="text-sm text-muted-foreground">Bank Withdrawal</p>
          <p className="text-2xl font-bold text-[hsl(var(--stat-orange))] mt-2">৳{(summary?.bankWithdrawal || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Big balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--stat-green))] text-white rounded-2xl p-6 text-center">
          <p className="text-lg font-bengali">বাস্তব ব্যালেন্স</p>
          <p className="text-sm opacity-80">আয় − ব্যয়</p>
          <p className="text-4xl font-bold mt-2">৳{realBalance.toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-deep-purple))] text-white rounded-2xl p-6 text-center">
          <p className="text-lg font-bengali">অবশিষ্ট ব্যালেন্স</p>
          <p className="text-sm opacity-80">(আয়+পাওনা) − (ব্যয়+দেনা)</p>
          <p className="text-4xl font-bold mt-2">৳{remainingBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default KhataCombinedPage;
