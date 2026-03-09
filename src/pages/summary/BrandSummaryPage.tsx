import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const BrandSummaryPage = () => {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("*"); return data || []; },
  });

  const { data: saleItems = [] } = useQuery({
    queryKey: ["brand-sales"],
    queryFn: async () => {
      const { data } = await supabase.from("sales").select("brand_id, season, sale_items(cartons, pairs, amount)");
      return data || [];
    },
  });

  const brandMap: Record<string, { name: string; cartons: number; pairs: number; bill: number; winter: number; summer: number }> = {};
  brands.forEach(b => { brandMap[b.id] = { name: b.name_bn, cartons: 0, pairs: 0, bill: 0, winter: 0, summer: 0 }; });

  saleItems.forEach((s: any) => {
    const bid = s.brand_id;
    if (!bid || !brandMap[bid]) return;
    const items = s.sale_items || [];
    items.forEach((i: any) => {
      brandMap[bid].cartons += Number(i.cartons || 0);
      brandMap[bid].pairs += Number(i.pairs || 0);
      brandMap[bid].bill += Number(i.amount || 0);
      if (s.season === "winter") brandMap[bid].winter += Number(i.cartons || 0);
      else brandMap[bid].summer += Number(i.cartons || 0);
    });
  });

  const rows = Object.values(brandMap).filter(b => b.cartons > 0 || b.bill > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">ব্র্যান্ড সারসংক্ষেপ</h1><p className="text-sm text-muted-foreground">Brand Summary</p></div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">ব্র্যান্ড</th><th className="p-3 text-right">মোট কার্টন</th><th className="p-3 text-right">মোট জোড়া</th>
            <th className="p-3 text-right">মোট বিল</th><th className="p-3 text-right">শীত</th><th className="p-3 text-right">গরম</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-bengali">{r.name}</td><td className="p-3 text-right">{r.cartons}</td><td className="p-3 text-right">{r.pairs}</td>
                <td className="p-3 text-right font-bold">৳{r.bill.toLocaleString()}</td><td className="p-3 text-right">{r.winter}</td><td className="p-3 text-right">{r.summer}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground font-bengali">কোনো ডেটা নেই</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrandSummaryPage;
