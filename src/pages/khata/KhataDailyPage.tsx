import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const typeLabels: Record<string, { bn: string; color: string }> = {
  income: { bn: "আয়", color: "hsl(var(--stat-green))" },
  expense: { bn: "ব্যয়", color: "hsl(var(--stat-red))" },
  cash_receive: { bn: "নগদ পেলাম", color: "hsl(var(--stat-green))" },
  cash_payment: { bn: "নগদ দিলাম", color: "hsl(var(--stat-red))" },
  bank_deposit: { bn: "ব্যাংকে জমা", color: "hsl(var(--stat-blue))" },
  bank_withdrawal: { bn: "ব্যাংক থেকে তুললাম", color: "hsl(var(--stat-blue))" },
};

const KhataDailyPage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["daily_transactions", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_transactions").select("*").eq("date", date).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const totals = transactions.reduce(
    (acc, t) => {
      const amt = Number(t.amount);
      if (t.type === "income" || t.type === "cash_receive") acc.income += amt;
      if (t.type === "expense" || t.type === "cash_payment") acc.expense += amt;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const rowBg = (type: string | null) => {
    if (type === "income" || type === "cash_receive") return "bg-[hsl(var(--stat-green))]/5";
    if (type === "expense" || type === "cash_payment") return "bg-[hsl(var(--stat-red))]/5";
    if (type?.startsWith("bank")) return "bg-[hsl(var(--stat-blue))]/5";
    return "";
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-bengali">দৈনিক তালিকা</h1>
        <p className="text-sm text-muted-foreground">Daily Transactions</p>
      </div>

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="border-2 border-primary rounded-xl px-5 py-3 text-lg font-bold w-full max-w-xs" />

      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">সময়</TableHead>
                <TableHead className="font-bengali text-base">ধরন</TableHead>
                <TableHead className="font-bengali text-base text-right">পরিমাণ</TableHead>
                <TableHead className="font-bengali text-base">নোট</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => {
                const label = typeLabels[t.type || ""] || { bn: t.type, color: "inherit" };
                return (
                  <TableRow key={t.id} className={rowBg(t.type)}>
                    <TableCell className="text-sm">{t.created_at ? new Date(t.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                    <TableCell><span className="font-bengali font-semibold" style={{ color: label.color }}>{label.bn}</span></TableCell>
                    <TableCell className="text-right font-bold text-base">৳{Number(t.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{t.note || "—"}</TableCell>
                  </TableRow>
                );
              })}
              {transactions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8 text-muted-foreground">এই তারিখে কোনো লেনদেন নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sticky summary */}
      <div className="sticky bottom-16 md:bottom-0 grid grid-cols-3 gap-3">
        <div className="bg-[hsl(var(--stat-green))] text-white rounded-xl p-4 text-center">
          <p className="text-sm font-bengali">মোট আয়</p>
          <p className="text-xl font-bold">৳{totals.income.toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-red))] text-white rounded-xl p-4 text-center">
          <p className="text-sm font-bengali">মোট ব্যয়</p>
          <p className="text-xl font-bold">৳{totals.expense.toLocaleString()}</p>
        </div>
        <div className="bg-[hsl(var(--stat-blue))] text-white rounded-xl p-4 text-center">
          <p className="text-sm font-bengali">বাস্তব ব্যালেন্স</p>
          <p className="text-xl font-bold">৳{(totals.income - totals.expense).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default KhataDailyPage;
