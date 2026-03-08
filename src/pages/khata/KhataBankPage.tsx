import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KhataBankPage = () => {
  const [bankId, setBankId] = useState("");

  const { data: banks = [] } = useQuery({
    queryKey: ["bank_accounts_all"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("*").order("bank_name");
      return data || [];
    },
  });

  const selectedBank = banks.find((b) => b.id === bankId);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["bank_transactions", bankId],
    enabled: !!bankId,
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_transactions").select("*")
        .eq("bank_id", bankId).in("type", ["bank_deposit", "bank_withdrawal"])
        .order("date").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  let runningBalance = Number(selectedBank?.opening_balance || 0);
  const rows = transactions.map((t) => {
    const isDeposit = t.type === "bank_deposit";
    const amt = Number(t.amount);
    runningBalance += isDeposit ? amt : -amt;
    return { ...t, isDeposit, runningBalance };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-bengali">ব্যাংক বই</h1>
        <p className="text-sm text-muted-foreground">Bank Book</p>
      </div>

      <select className="w-full max-w-md border-2 border-primary rounded-xl px-4 py-3 text-lg font-bengali" value={bankId} onChange={(e) => setBankId(e.target.value)}>
        <option value="">ব্যাংক নির্বাচন করুন</option>
        {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_no}</option>)}
      </select>

      {bankId && selectedBank && (
        <div className="bg-[hsl(var(--stat-blue))]/10 border border-[hsl(var(--stat-blue))]/30 rounded-xl p-4">
          <p className="font-bengali">Opening Balance: <strong>৳{Number(selectedBank.opening_balance || 0).toLocaleString()}</strong></p>
        </div>
      )}

      {bankId && (isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali">তারিখ</TableHead>
                <TableHead className="font-bengali">বিবরণ</TableHead>
                <TableHead className="font-bengali text-right">জমা</TableHead>
                <TableHead className="font-bengali text-right">উত্তোলন</TableHead>
                <TableHead className="font-bengali text-right">ব্যালেন্স</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/50">
                <TableCell className="font-bengali font-bold" colSpan={4}>Opening Balance</TableCell>
                <TableCell className="text-right font-bold">৳{Number(selectedBank?.opening_balance || 0).toLocaleString()}</TableCell>
              </TableRow>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell className="text-sm font-bengali">{r.note || "—"}</TableCell>
                  <TableCell className="text-right font-bold text-[hsl(var(--stat-green))]">{r.isDeposit ? `৳${Number(r.amount).toLocaleString()}` : ""}</TableCell>
                  <TableCell className="text-right font-bold text-[hsl(var(--stat-red))]">{!r.isDeposit ? `৳${Number(r.amount).toLocaleString()}` : ""}</TableCell>
                  <TableCell className="text-right font-bold">৳{r.runningBalance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো লেনদেন নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default KhataBankPage;
