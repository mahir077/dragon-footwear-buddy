import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const SalesListPage = () => {
  const [partyFilter, setPartyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: sales } = useQuery({
    queryKey: ["sales-list", partyFilter, typeFilter],
    queryFn: async () => {
      let q = supabase.from("sales").select("*, parties(name)").order("date", { ascending: false });
      if (partyFilter) q = q.eq("party_id", partyFilter);
      if (typeFilter) q = q.eq("sale_type", typeFilter);
      const { data } = await q;
      return data || [];
    },
  });
  const { data: parties } = useQuery({ queryKey: ["parties-all"], queryFn: async () => { const { data } = await supabase.from("parties").select("*"); return data || []; } });

  const totals = (sales || []).reduce((acc, s) => ({
    totalBill: acc.totalBill + (s.total_bill || 0),
    totalPaid: acc.totalPaid + (s.paid_amount || 0),
    totalDue: acc.totalDue + ((s.total_bill || 0) - (s.paid_amount || 0)),
    totalCartons: acc.totalCartons,
  }), { totalBill: 0, totalPaid: 0, totalDue: 0, totalCartons: 0 });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">বিক্রয় তালিকা</h1><p className="text-sm text-muted-foreground">Sales List</p></div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>

      <div className="flex gap-3">
        <Select value={partyFilter} onValueChange={setPartyFilter}><SelectTrigger className="w-48"><SelectValue placeholder="পার্টি ফিল্টার" /></SelectTrigger>
          <SelectContent><SelectItem value="">সব</SelectItem>{parties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-48"><SelectValue placeholder="ধরন" /></SelectTrigger>
          <SelectContent><SelectItem value="">সব</SelectItem><SelectItem value="cash">নগদ</SelectItem><SelectItem value="credit">বাকি</SelectItem><SelectItem value="lot">লট</SelectItem></SelectContent></Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">তারিখ</th><th className="p-3 text-left">মেমো</th><th className="p-3 text-left">পার্টি</th>
            <th className="p-3 text-left">ধরন</th><th className="p-3 text-right">মোট বিল</th><th className="p-3 text-right">জমা</th><th className="p-3 text-right">বাকি</th>
          </tr></thead>
          <tbody>
            {sales?.map(s => {
              const due = (s.total_bill || 0) - (s.paid_amount || 0);
              return (
                <tr key={s.id} className={`border-t ${due > 0 ? "bg-destructive/5" : ""}`}>
                  <td className="p-3">{s.date}</td><td className="p-3">{s.memo_no}</td>
                  <td className="p-3 font-bengali">{(s as any).parties?.name || "-"}</td>
                  <td className="p-3">{s.sale_type}</td>
                  <td className="p-3 text-right font-bold">৳{(s.total_bill || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-success font-bold">৳{(s.paid_amount || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-bold ${due > 0 ? "text-destructive" : ""}`}>৳{due.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted font-bold font-bengali">
            <tr><td colSpan={4} className="p-3">মোট</td>
              <td className="p-3 text-right">৳{totals.totalBill.toLocaleString()}</td>
              <td className="p-3 text-right text-success">৳{totals.totalPaid.toLocaleString()}</td>
              <td className="p-3 text-right text-destructive">৳{totals.totalDue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SalesListPage;
