import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const toBn = (n: number) => n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export default function WasteSalePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [note, setNote] = useState("");

  const total = typeof quantity === "number" && typeof rate === "number" ? quantity * rate : 0;

  // Get active year
  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_years")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  // Fetch waste sales
  const { data: sales = [] } = useQuery({
    queryKey: ["waste_sales", activeYear?.id],
    queryFn: async () => {
      const q = supabase.from("waste_sales").select("*").order("date", { ascending: false });
      if (activeYear?.id) q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
    enabled: !!activeYear,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("waste_sales").insert({
        year_id: activeYear?.id,
        date,
        item_name: itemName,
        quantity: typeof quantity === "number" ? quantity : 0,
        rate: typeof rate === "number" ? rate : 0,
        total,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" });
      qc.invalidateQueries({ queryKey: ["waste_sales"] });
      setItemName("");
      setQuantity("");
      setRate("");
      setNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waste_sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "মুছে ফেলা হয়েছে" });
      qc.invalidateQueries({ queryKey: ["waste_sales"] });
    },
  });

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s: any) => {
      const key = s.date?.substring(0, 7) || "unknown";
      map[key] = (map[key] || 0) + (s.total || 0);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sales]);

  const grandTotal = sales.reduce((s: number, r: any) => s + (r.total || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🗑️ বর্জ্য বিক্রি</h1>

      {/* Entry Form */}
      <Card>
        <CardHeader><CardTitle>নতুন এন্ট্রি</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>তারিখ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>আইটেম নাম</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="যেমন: চামড়ার টুকরা" />
            </div>
            <div>
              <Label>পরিমাণ</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value ? +e.target.value : "")} placeholder="০" />
            </div>
            <div>
              <Label>দর (৳)</Label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value ? +e.target.value : "")} placeholder="০" />
            </div>
            <div>
              <Label>মোট (৳)</Label>
              <Input value={total ? `৳ ${toBn(total)}` : "—"} readOnly className="bg-muted font-semibold" />
            </div>
            <div>
              <Label>নোট</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক" />
            </div>
          </div>
          <Button
            className="mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => saveMutation.mutate()}
            disabled={!itemName || !quantity || !rate || saveMutation.isPending}
          >
            {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </Button>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader><CardTitle>বিক্রয় তালিকা ({toBn(sales.length)} টি)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>আইটেম</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-right">দর</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead>নোট</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">কোনো তথ্য নেই</TableCell></TableRow>
                )}
                {sales.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.item_name}</TableCell>
                    <TableCell className="text-right">{toBn(s.quantity || 0)}</TableCell>
                    <TableCell className="text-right">৳{toBn(s.rate || 0)}</TableCell>
                    <TableCell className="text-right font-semibold">৳{toBn(s.total || 0)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.note || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">সর্বমোট</p>
            <p className="text-xl font-bold">৳ {toBn(grandTotal)}</p>
          </CardContent>
        </Card>
        {monthlyTotals.map(([month, tot]) => (
          <Card key={month}>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">{month}</p>
              <p className="text-lg font-semibold">৳ {toBn(tot)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
