import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const toBn = (n: number) => "০১২৩৪৫৬৭৮৯".split("").reduce((s, d, i) => s.replace(new RegExp(String(i), "g"), d), Math.round(n).toLocaleString());

const MasterSummaryPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: income = 0 } = useQuery({
    queryKey: ["sum-income", from, to],
    queryFn: async () => {
      let q = supabase.from("daily_transactions").select("amount").eq("type", "income");
      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      const { data } = await q;
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: expense = 0 } = useQuery({
    queryKey: ["sum-expense", from, to],
    queryFn: async () => {
      let q = supabase.from("daily_transactions").select("amount").eq("type", "expense");
      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      const { data } = await q;
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: receivable = 0 } = useQuery({
    queryKey: ["sum-receivable"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("current_balance").gt("current_balance", 0);
      return data?.reduce((s, r) => s + Number(r.current_balance), 0) || 0;
    },
  });

  const { data: loanBorrowed = 0 } = useQuery({
    queryKey: ["sum-loan-borrowed"],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("opening_balance").eq("direction", "borrowed");
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: loanLent = 0 } = useQuery({
    queryKey: ["sum-loan-lent"],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("opening_balance").eq("direction", "lent");
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: bankBal = 0 } = useQuery({
    queryKey: ["sum-bank"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("opening_balance");
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: fdrBal = 0 } = useQuery({
    queryKey: ["sum-fdr"],
    queryFn: async () => {
      const { data } = await supabase.from("fixed_deposits").select("opening_balance");
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: capitalBal = 0 } = useQuery({
    queryKey: ["sum-capital"],
    queryFn: async () => {
      const { data } = await supabase.from("capital_statements").select("deposit, withdrawal, opening");
      return data?.reduce((s, r) => s + Number(r.opening || 0) + Number(r.deposit || 0) - Number(r.withdrawal || 0), 0) || 0;
    },
  });

  const actualBal = income - expense;
  const remainingBal = (income + receivable) - (expense + loanBorrowed);
  const cashBal = income - expense; // simplified

  const rows = [
    { bn: "মোট আয়", val: income },
    { bn: "মোট ব্যয়", val: expense },
    { bn: "মোট পাওনা", val: receivable },
    { bn: "মোট দেনা", val: loanBorrowed },
    { bn: "নগদ ব্যালেন্স", val: cashBal },
    { bn: "ব্যাংক ব্যালেন্স", val: bankBal },
    { bn: "FDR ব্যালেন্স", val: fdrBal },
    { bn: "লোন নেওয়া বাকি", val: loanBorrowed },
    { bn: "লোন দেওয়া বাকি", val: loanLent },
    { bn: "মূলধন", val: capitalBal },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-bengali">সকল হিসাবের সারসংক্ষেপ</h1>
          <p className="text-sm text-muted-foreground">Master Summary</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>

      <div className="flex gap-3">
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-44" />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-44" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 text-white" style={{ background: "#16A34A" }}>
          <p className="text-sm opacity-80 font-bengali">বাস্তব ব্যালেন্স</p>
          <p className="text-sm opacity-60">আয় − ব্যয়</p>
          <p className="text-4xl font-extrabold font-bengali mt-2">৳{toBn(actualBal)}</p>
        </div>
        <div className="rounded-2xl p-6 text-white" style={{ background: "#7C3AED" }}>
          <p className="text-sm opacity-80 font-bengali">অবশিষ্ট ব্যালেন্স</p>
          <p className="text-sm opacity-60">(আয়+পাওনা)−(ব্যয়+দেনা)</p>
          <p className="text-4xl font-extrabold font-bengali mt-2">৳{toBn(remainingBal)}</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali"><th className="p-3 text-left">বিভাগ</th><th className="p-3 text-right">পরিমাণ</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.bn} className="border-t"><td className="p-3 font-bengali">{r.bn}</td><td className="p-3 text-right font-bold">৳{toBn(r.val)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterSummaryPage;
