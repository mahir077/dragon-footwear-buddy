import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PartySummaryPage = () => {
  const [search, setSearch] = useState("");

  const { data: parties = [] } = useQuery({
    queryKey: ["party-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("*").order("current_balance", { ascending: false });
      return data || [];
    },
  });

  const filtered = parties.filter(p => !search || (p.name || "").includes(search));
  const totals = filtered.reduce((a, p) => ({
    sales: a.sales + Number(p.total_sales || 0),
    paid: a.paid + Number(p.total_paid || 0),
    bal: a.bal + Number(p.current_balance || 0),
  }), { sales: 0, paid: 0, bal: 0 });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">পার্টি সারসংক্ষেপ</h1><p className="text-sm text-muted-foreground">Party Summary</p></div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>
      <div className="relative w-64"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input placeholder="নাম খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">নাম</th><th className="p-3 text-right">মোট বিক্রি</th><th className="p-3 text-right">মোট জমা</th><th className="p-3 text-right">বর্তমান বাকি</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.party_id} className={`border-t ${Number(p.current_balance || 0) > 0 ? "bg-destructive/10 text-destructive" : ""}`}>
                <td className="p-3 font-bengali">{p.name}</td>
                <td className="p-3 text-right">৳{Number(p.total_sales || 0).toLocaleString()}</td>
                <td className="p-3 text-right">৳{Number(p.total_paid || 0).toLocaleString()}</td>
                <td className="p-3 text-right font-bold">৳{Number(p.current_balance || 0).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-t bg-muted font-bold font-bengali">
              <td className="p-3">মোট</td>
              <td className="p-3 text-right">৳{totals.sales.toLocaleString()}</td>
              <td className="p-3 text-right">৳{totals.paid.toLocaleString()}</td>
              <td className="p-3 text-right">৳{totals.bal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartySummaryPage;
