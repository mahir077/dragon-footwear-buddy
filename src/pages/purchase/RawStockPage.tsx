import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const RawStockPage = () => {
  const { data: materials } = useQuery({
    queryKey: ["raw_materials_stock"],
    queryFn: async () => {
      const { data: mats } = await supabase.from("raw_materials").select("*").eq("is_active", true);
      if (!mats) return [];

      const { data: items } = await supabase.from("purchase_items").select("material_id, quantity");

      const stockMap: Record<string, { received: number }> = {};
      items?.forEach((i) => {
        if (!stockMap[i.material_id!]) stockMap[i.material_id!] = { received: 0 };
        stockMap[i.material_id!].received += Number(i.quantity);
      });

      return mats.map((m) => ({
        ...m,
        received: stockMap[m.id]?.received || 0,
        issued: 0, // placeholder for production usage
        current: (m.opening_stock || 0) + (stockMap[m.id]?.received || 0),
      }));
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">কাঁচামাল স্টক</h1>
      <p className="text-xs text-muted-foreground mb-4">Raw Material Stock</p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">কাঁচামালের নাম</TableHead>
              <TableHead className="font-bengali">ইউনিট</TableHead>
              <TableHead className="font-bengali text-right">Opening</TableHead>
              <TableHead className="font-bengali text-right">পেয়েছি</TableHead>
              <TableHead className="font-bengali text-right">দিয়েছি</TableHead>
              <TableHead className="font-bengali text-right">বর্তমান স্টক</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials?.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-bengali text-sm">{m.name_bn}</TableCell>
                <TableCell className="text-xs">{m.unit}</TableCell>
                <TableCell className="text-right text-xs">{toBn(m.opening_stock || 0)}</TableCell>
                <TableCell className="text-right text-xs text-green-600">{toBn(m.received)}</TableCell>
                <TableCell className="text-right text-xs text-red-600">{toBn(m.issued)}</TableCell>
                <TableCell className="text-right text-sm font-bold">{toBn(m.current)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RawStockPage;
