import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const StockSummaryPage = () => {
  const { data: stock = [] } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: async () => { const { data } = await supabase.from("v_shoe_stock").select("*"); return data || []; },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => { const { data } = await supabase.from("locations").select("*"); return data || []; },
  });

  const locMap: Record<string, string> = {};
  locations.forEach(l => { locMap[l.id] = l.name_bn; });

  // Group by location
  const grouped: Record<string, { winter: number; summer: number; pairs: number }> = {};
  stock.forEach(s => {
    const loc = s.location_id || "unknown";
    if (!grouped[loc]) grouped[loc] = { winter: 0, summer: 0, pairs: 0 };
    const c = Number(s.current_cartons || 0);
    const p = Number(s.current_pairs || 0);
    if (s.season === "winter") grouped[loc].winter += c;
    else grouped[loc].summer += c;
    grouped[loc].pairs += p;
  });

  const rows = Object.entries(grouped).map(([loc, v]) => ({
    location: locMap[loc] || loc,
    ...v,
    total: v.winter + v.summer,
    low: v.winter + v.summer < 5,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">স্টক সারসংক্ষেপ</h1><p className="text-sm text-muted-foreground">Stock Summary</p></div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">লোকেশন</th><th className="p-3 text-right">শীত কার্টন</th><th className="p-3 text-right">গরম কার্টন</th>
            <th className="p-3 text-right">মোট কার্টন</th><th className="p-3 text-right">মোট জোড়া</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-t ${r.low ? "bg-destructive/10 text-destructive" : ""}`}>
                <td className="p-3 font-bengali">{r.location}</td><td className="p-3 text-right">{r.winter}</td><td className="p-3 text-right">{r.summer}</td>
                <td className="p-3 text-right font-bold">{r.total}</td><td className="p-3 text-right">{r.pairs}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground font-bengali">কোনো ডেটা নেই</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockSummaryPage;
