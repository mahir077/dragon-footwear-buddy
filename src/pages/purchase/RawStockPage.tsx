import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const db = supabase as any;
const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const toBnMoney = (n: number) => n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const RawStockPage = () => {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["raw_materials_stock_full"],
    queryFn: async () => {
      const { data: mats } = await supabase.from("raw_materials").select("*").eq("is_active", true);
      if (!mats) return [];

      const { data: purchaseItems } = await supabase.from("purchase_items").select("material_id, quantity, amount");
      const { data: movements } = await db.from("raw_material_movements").select("material_id, amount");

      const stockMap: Record<string, { received_qty: number; received_amount: number; used_amount: number }> = {};

      purchaseItems?.forEach((i: any) => {
        if (!stockMap[i.material_id]) stockMap[i.material_id] = { received_qty: 0, received_amount: 0, used_amount: 0 };
        stockMap[i.material_id].received_qty += Number(i.quantity || 0);
        stockMap[i.material_id].received_amount += Number(i.amount || 0);
      });

      movements?.forEach((m: any) => {
        if (!stockMap[m.material_id]) stockMap[m.material_id] = { received_qty: 0, received_amount: 0, used_amount: 0 };
        const amt = Number(m.amount);
        if (amt < 0) stockMap[m.material_id].used_amount += Math.abs(amt);
      });

      return mats.map((m: any) => {
        const s = stockMap[m.id] || { received_qty: 0, received_amount: 0, used_amount: 0 };
        return {
          ...m,
          received_qty: s.received_qty,
          received_amount: s.received_amount,
          used_amount: s.used_amount,
          current_amount: s.received_amount - s.used_amount,
        };
      });
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
              <TableHead className="font-bengali">কাঁচামাল</TableHead>
              <TableHead className="font-bengali">ইউনিট</TableHead>
              <TableHead className="font-bengali text-right">পেয়েছি (পরিমাণ)</TableHead>
              <TableHead className="font-bengali text-right">পেয়েছি (৳)</TableHead>
              <TableHead className="font-bengali text-right">উৎপাদনে গেছে (৳)</TableHead>
              <TableHead className="font-bengali text-right">বর্তমান (৳)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center font-bengali text-muted-foreground py-8">লোড হচ্ছে...</TableCell></TableRow>
            ) : materials.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center font-bengali text-muted-foreground py-8">কোনো কাঁচামাল নেই</TableCell></TableRow>
            ) : (materials as any[]).map((m: any) => (
              <TableRow key={m.id} className={m.current_amount <= 0 && m.received_amount > 0 ? "bg-red-50" : ""}>
                <TableCell className="font-bengali text-sm font-medium">{m.name_bn}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.unit}</TableCell>
                <TableCell className="text-right text-xs">{m.received_qty > 0 ? `${toBn(m.received_qty)} ${m.unit}` : "—"}</TableCell>
                <TableCell className="text-right text-xs text-green-600 font-semibold">
                  {m.received_amount > 0 ? `৳${toBnMoney(m.received_amount)}` : "—"}
                </TableCell>
                <TableCell className="text-right text-xs text-red-600 font-semibold">
                  {m.used_amount > 0 ? `৳${toBnMoney(m.used_amount)}` : "—"}
                </TableCell>
                <TableCell className={`text-right text-sm font-bold ${m.current_amount <= 0 && m.received_amount > 0 ? "text-red-600" : "text-green-700"}`}>
                  ৳{toBnMoney(m.current_amount)}
                  {m.current_amount <= 0 && m.received_amount > 0 && " ⚠️"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RawStockPage;