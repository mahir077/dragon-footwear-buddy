import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";

const KhataCashPage = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["cash_transactions", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_transactions").select("*")
        .gte("date", startDate).lte("date", endDate)
        .in("type", ["income", "expense", "cash_receive", "cash_payment"])
        .order("date").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  let runningBalance = 0;
  const rows = transactions.map((t) => {
    const isIncome = t.type === "income" || t.type === "cash_receive";
    const amt = Number(t.amount);
    runningBalance += isIncome ? amt : -amt;
    return { ...t, isIncome, runningBalance };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-bengali">নগদ বই</h1>
          <p className="text-sm text-muted-foreground">Cash Book</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bengali text-sm hover:opacity-90">
          <Printer className="w-4 h-4" /> প্রিন্ট
        </button>
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

      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali">তারিখ</TableHead>
                <TableHead className="font-bengali">বিবরণ</TableHead>
                <TableHead className="font-bengali text-right">জমা</TableHead>
                <TableHead className="font-bengali text-right">খরচ</TableHead>
                <TableHead className="font-bengali text-right">ব্যালেন্স</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell className="text-sm font-bengali">{r.note || "—"}</TableCell>
                  <TableCell className="text-right font-bold text-[hsl(var(--stat-green))]">{r.isIncome ? `৳${Number(r.amount).toLocaleString()}` : ""}</TableCell>
                  <TableCell className="text-right font-bold text-[hsl(var(--stat-red))]">{!r.isIncome ? `৳${Number(r.amount).toLocaleString()}` : ""}</TableCell>
                  <TableCell className="text-right font-bold">৳{r.runningBalance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো লেনদেন নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default KhataCashPage;
