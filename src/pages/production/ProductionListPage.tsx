import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const ProductionListPage = () => {
  const { data: productions } = useQuery({
    queryKey: ["productions"],
    queryFn: async () => {
      const { data } = await supabase.from("productions")
        .select("*, brands:brand_id(name_bn), models:model_id(name_bn), articles:article_id(article_no), colors:color_id(name_bn), locations:location_id(name_bn)")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">উৎপাদন তালিকা</h1>
          <p className="text-xs text-muted-foreground">Production List</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs font-bengali">
          <Printer className="w-3.5 h-3.5 mr-1" /> প্রিন্ট
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">ব্র্যান্ড</TableHead>
              <TableHead className="font-bengali">মডেল</TableHead>
              <TableHead className="font-bengali">আর্টিকেল</TableHead>
              <TableHead className="font-bengali">রঙ</TableHead>
              <TableHead className="font-bengali">সিজন</TableHead>
              <TableHead className="font-bengali text-right">পূর্ণ কার্টন</TableHead>
              <TableHead className="font-bengali text-right">শর্ট</TableHead>
              <TableHead className="font-bengali text-right">মোট জোড়া</TableHead>
              <TableHead className="font-bengali">লোকেশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions?.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center font-bengali py-6">কোনো উৎপাদন নেই</TableCell></TableRow>
            ) : productions?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.date}</TableCell>
                <TableCell className="text-xs font-bengali">{(p as any).brands?.name_bn || "-"}</TableCell>
                <TableCell className="text-xs font-bengali">{(p as any).models?.name_bn || "-"}</TableCell>
                <TableCell className="text-xs font-mono">{(p as any).articles?.article_no || "-"}</TableCell>
                <TableCell className="text-xs font-bengali">{(p as any).colors?.name_bn || "-"}</TableCell>
                <TableCell className="text-xs font-bengali">{p.season || "-"}</TableCell>
                <TableCell className="text-right text-xs">{toBn(p.full_cartons || 0)}</TableCell>
                <TableCell className="text-right text-xs">{toBn(p.short_cartons || 0)}</TableCell>
                <TableCell className="text-right text-xs font-bold">{toBn(p.pairs_count || 0)}</TableCell>
                <TableCell className="text-xs font-bengali">{(p as any).locations?.name_bn || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductionListPage;
