import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const TransferPage = () => {
  const qc = useQueryClient();
  const [articleId, setArticleId] = useState("");
  const [colorId, setColorId] = useState("");
  const [season, setSeason] = useState("শীত");
  const [fromLoc, setFromLoc] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [cartons, setCartons] = useState(0);
  const [pairs, setPairs] = useState(0);

  const { data: articles } = useQuery({ queryKey: ["articles"], queryFn: async () => { const { data } = await supabase.from("articles").select("*").eq("is_active", true); return data || []; } });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: async () => { const { data } = await supabase.from("colors").select("*").eq("is_active", true); return data || []; } });
  const { data: locations } = useQuery({ queryKey: ["locations"], queryFn: async () => { const { data } = await supabase.from("locations").select("*").eq("is_active", true); return data || []; } });

  const { data: transfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data } = await supabase.from("stock_movements").select("*, articles:article_id(article_no), colors:color_id(name_bn), from_loc:from_location_id(name_bn), to_loc:to_location_id(name_bn)")
        .in("type", ["transfer_out", "transfer_in"]).order("date", { ascending: false });
      return data || [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const base = { date: today, article_id: articleId || null, color_id: colorId || null, season, cartons, pairs };
      const { error: e1 } = await supabase.from("stock_movements").insert({ ...base, type: "transfer_out", from_location_id: fromLoc || null });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("stock_movements").insert({ ...base, type: "transfer_in", to_location_id: toLoc || null });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("সফলভাবে সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["transfers"] });
      setCartons(0); setPairs(0);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">ট্রান্সফার</h1>
      <p className="text-xs text-muted-foreground mb-4">Stock Transfer</p>

      <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-bengali text-sm">আর্টিকেল</Label>
            <Select value={articleId} onValueChange={setArticleId}><SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{articles?.map((a) => <SelectItem key={a.id} value={a.id}>{a.article_no}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="font-bengali text-sm">রঙ</Label>
            <Select value={colorId} onValueChange={setColorId}><SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{colors?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-bengali text-sm">From লোকেশন</Label>
            <Select value={fromLoc} onValueChange={setFromLoc}><SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{locations?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name_bn}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="font-bengali text-sm">To লোকেশন</Label>
            <Select value={toLoc} onValueChange={setToLoc}><SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{locations?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name_bn}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="font-bengali text-sm">সিজন</Label>
            <Select value={season} onValueChange={setSeason}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="শীত">❄️ শীত</SelectItem><SelectItem value="গরম">☀️ গরম</SelectItem></SelectContent></Select></div>
          <div><Label className="font-bengali text-sm">কার্টন</Label><Input type="number" value={cartons || ""} onChange={(e) => setCartons(+e.target.value)} className="text-sm" /></div>
          <div><Label className="font-bengali text-sm">জোড়া</Label><Input type="number" value={pairs || ""} onChange={(e) => setPairs(+e.target.value)} className="text-sm" /></div>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full bg-green-600 hover:bg-green-700 text-white font-bengali font-bold py-4">
          ট্রান্সফার সংরক্ষণ করুন
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="font-bengali">তারিখ</TableHead><TableHead className="font-bengali">ধরন</TableHead><TableHead className="font-bengali">আর্টিকেল</TableHead>
            <TableHead className="font-bengali">রঙ</TableHead><TableHead className="font-bengali text-right">কার্টন</TableHead><TableHead className="font-bengali text-right">জোড়া</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {transfers?.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center font-bengali py-6">কোনো ট্রান্সফার নেই</TableCell></TableRow> :
              transfers?.filter((t) => t.type === "transfer_out").map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.date}</TableCell>
                  <TableCell className="text-xs font-bengali">{(t as any).from_loc?.name_bn || "-"} → {(t as any).to_loc?.name_bn || "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{(t as any).articles?.article_no || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{(t as any).colors?.name_bn || "-"}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(t.cartons || 0)}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(t.pairs || 0)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransferPage;
