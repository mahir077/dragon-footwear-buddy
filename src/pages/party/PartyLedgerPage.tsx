import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const PartyLedgerPage = () => {
  const [searchParams] = useSearchParams();
  const [partyId, setPartyId] = useState(searchParams.get("party") || "");

  const { data: parties = [] } = useQuery({
    queryKey: ["parties-all"],
    queryFn: async () => { const { data } = await supabase.from("parties").select("*").order("name"); return data || []; }
  });

  const party = parties.find((p: any) => p.id === partyId);

  const { data: sales = [] } = useQuery({
    queryKey: ["party-sales", partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data } = await supabase.from("sales").select("*").eq("party_id", partyId).order("date");
      return data || [];
    },
    enabled: !!partyId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["party-payments-ledger", partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data } = await (supabase as any).from("party_payments").select("*").eq("party_id", partyId).order("date");
      return data || [];
    },
    enabled: !!partyId,
  });

  // Merge sales + payments into one sorted list
  const allRows = [
    ...sales.map((s: any) => ({
      id: s.id,
      date: s.date,
      memo: s.memo_no,
      type: "sale",
      debit: s.total_bill || 0,
      credit: s.paid_amount || 0,
      note: "",
    })),
    ...payments.map((p: any) => ({
      id: p.id,
      date: p.date,
      memo: "—",
      type: p.type === "payment" ? "payment" : "receipt",
      debit: p.type === "payment" ? p.amount : 0,
      credit: p.type === "receipt" ? p.amount : 0,
      note: p.note || "",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Running balance
  let balance = (party as any)?.opening_balance || 0;
  const rows = allRows.map(r => {
    balance += r.debit - r.credit;
    return { ...r, balance };
  });

  const totalDebit = allRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = allRows.reduce((s, r) => s + r.credit, 0);

  const typeLabel: any = {
    sale: { bn: "বিক্রয়", color: "text-blue-600" },
    receipt: { bn: "আদায়", color: "text-green-600" },
    payment: { bn: "প্রদান", color: "text-red-600" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-bengali">পার্টি লেজার</h1>
          <p className="text-sm text-muted-foreground">Party Ledger</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" />প্রিন্ট
        </Button>
      </div>

      <Select value={partyId} onValueChange={setPartyId}>
        <SelectTrigger className="w-full md:w-80">
          <SelectValue placeholder="পার্টি নির্বাচন করুন" />
        </SelectTrigger>
        <SelectContent>
          {parties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {party && (
        <div className="bg-card rounded-xl border p-4 flex items-center justify-between">
          <div>
            <p className="font-bold font-bengali text-lg">{(party as any).name}</p>
            <p className="text-sm text-muted-foreground">{(party as any).address} | {(party as any).mobile}</p>
          </div>
          <div className={`text-right`}>
            <p className="text-xs font-bengali text-muted-foreground">বর্তমান বাকি</p>
            <p className={`text-xl font-extrabold font-bengali ${balance > 0 ? "text-red-600" : balance < 0 ? "text-blue-600" : "text-green-600"}`}>
              {balance > 0 ? "পাওনা " : balance < 0 ? "অগ্রিম " : "✓ "}৳{Math.abs(balance).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {partyId && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="font-bengali">
                <th className="p-3 text-left">তারিখ</th>
                <th className="p-3 text-left">মেমো</th>
                <th className="p-3 text-left">ধরন</th>
                <th className="p-3 text-left">নোট</th>
                <th className="p-3 text-right">ডেবিট</th>
                <th className="p-3 text-right">ক্রেডিট</th>
                <th className="p-3 text-right">ব্যালেন্স</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t bg-muted/50">
                <td colSpan={6} className="p-3 font-bengali">Opening Balance</td>
                <td className="p-3 text-right font-bold">৳{((party as any)?.opening_balance || 0).toLocaleString()}</td>
              </tr>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center font-bengali text-muted-foreground">কোনো লেনদেন নেই</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.memo}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bengali font-bold ${
                      r.type === "sale" ? "bg-blue-100 text-blue-700" :
                      r.type === "receipt" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {typeLabel[r.type]?.bn}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{r.note}</td>
                  <td className="p-3 text-right text-red-600 font-bold">
                    {r.debit > 0 ? `৳${r.debit.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-3 text-right text-green-600 font-bold">
                    {r.credit > 0 ? `৳${r.credit.toLocaleString()}` : "—"}
                  </td>
                  <td className={`p-3 text-right font-bold ${r.balance > 0 ? "text-red-600" : r.balance < 0 ? "text-blue-600" : "text-green-600"}`}>
                    ৳{Math.abs(r.balance).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-bold font-bengali">
              <tr>
                <td colSpan={4} className="p-3">মোট</td>
                <td className="p-3 text-right text-red-600">৳{totalDebit.toLocaleString()}</td>
                <td className="p-3 text-right text-green-600">৳{totalCredit.toLocaleString()}</td>
                <td className={`p-3 text-right ${balance > 0 ? "text-red-600" : "text-blue-600"}`}>
                  ৳{Math.abs(balance).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartyLedgerPage;