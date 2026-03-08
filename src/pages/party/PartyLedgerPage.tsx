import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PartyLedgerPage = () => {
  const [partyId, setPartyId] = useState("");

  const { data: parties } = useQuery({ queryKey: ["parties-all"], queryFn: async () => { const { data } = await supabase.from("parties").select("*"); return data || []; } });
  const party = parties?.find(p => p.id === partyId);

  const { data: sales } = useQuery({
    queryKey: ["party-sales", partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data } = await supabase.from("sales").select("*").eq("party_id", partyId).order("date");
      return data || [];
    },
    enabled: !!partyId,
  });

  let runningBalance = party?.opening_balance || 0;
  const rows = (sales || []).map(s => {
    runningBalance += (s.total_bill || 0) - (s.paid_amount || 0);
    return { ...s, balance: runningBalance };
  });

  const totalSales = (sales || []).reduce((s, r) => s + (r.total_bill || 0), 0);
  const totalPaid = (sales || []).reduce((s, r) => s + (r.paid_amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">পার্টি লেজার</h1><p className="text-sm text-muted-foreground">Party Ledger</p></div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>

      <Select value={partyId} onValueChange={setPartyId}>
        <SelectTrigger className="w-full md:w-80"><SelectValue placeholder="পার্টি নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>{parties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
      </Select>

      {party && (
        <div className="bg-card rounded-xl border p-4">
          <p className="font-bold font-bengali text-lg">{party.name}</p>
          <p className="text-sm text-muted-foreground">{party.address} | {party.mobile}</p>
        </div>
      )}

      {partyId && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="font-bengali">
              <th className="p-3 text-left">তারিখ</th><th className="p-3 text-left">মেমো</th>
              <th className="p-3 text-right">বিক্রি</th><th className="p-3 text-right">কমিশন</th>
              <th className="p-3 text-right">জমা</th><th className="p-3 text-right">ব্যালেন্স</th>
            </tr></thead>
            <tbody>
              <tr className="border-t bg-muted/50"><td className="p-3 font-bengali" colSpan={5}>Opening Balance</td>
                <td className="p-3 text-right font-bold">৳{(party?.opening_balance || 0).toLocaleString()}</td></tr>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.date}</td><td className="p-3">{r.memo_no}</td>
                  <td className="p-3 text-right">৳{(r.total_bill || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">৳{(r.commission || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-success">৳{(r.paid_amount || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-bold ${r.balance > 0 ? "text-destructive" : ""}`}>৳{r.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-bold font-bengali">
              <tr><td colSpan={2} className="p-3">মোট</td>
                <td className="p-3 text-right">৳{totalSales.toLocaleString()}</td><td className="p-3"></td>
                <td className="p-3 text-right text-success">৳{totalPaid.toLocaleString()}</td>
                <td className="p-3 text-right text-destructive">৳{runningBalance.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartyLedgerPage;
