import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const DamagePage = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [articleId, setArticleId] = useState("");
  const [colorId, setColorId] = useState("");
  const [season, setSeason] = useState("শীত");
  const [locationId, setLocationId] = useState("");
  const [cartons, setCartons] = useState(0);
  const [pairs, setPairs] = useState(0);
  const [reason, setReason] = useState("");

  const { data: articles } = useQuery({ queryKey: ["articles"], queryFn: async () => { const { data } = await supabase.from("articles").select("*").eq("is_active", true); return data || []; } });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: async () => { const { data } = await supabase.from("colors").select("*").eq("is_active", true); return data || []; } });
  const { data: locations } = useQuery({ queryKey: ["locations"], queryFn: async () => { const { data } = await supabase.from("locations").select("*").eq("is_active", true); return data || []; } });
  const { data: activeYear } = useQuery({ queryKey: ["activeYear"], queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single(); return data; } });

  const { data: damages } = useQuery({
    queryKey: ["damages"],
    queryFn: async () => {
      const { data } = await supabase.from("damage_items")
        .select("*, articles:article_id(article_no), colors:color_id(name_bn), locations:location_id(name_bn)")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("damage_items").insert({
        date: format(new Date(), "yyyy-MM-dd"),
        article_id: articleId || null,
        color_id: colorId || null,
        season,
        location_id: locationId || null,
        cartons, pairs, reason,
        year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("সফলভাবে সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["damages"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold font-bengali">ড্যামেজ</h1><p className="text-xs text-muted-foreground">Damage Items</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700 text-white font-bengali text-sm"><Plus className="w-4 h-4 mr-1" /> নতুন ড্যামেজ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-bengali">ড্যামেজ এন্ট্রি</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="font-bengali text-sm">আর্টিকেল</Label>
                <Select value={articleId} onValueChange={setArticleId}><SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{articles?.map((a) => <SelectItem key={a.id} value={a.id}>{a.article_no}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="font-bengali text-sm">রঙ</Label>
                <Select value={colorId} onValueChange={setColorId}><SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{colors?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="font-bengali text-sm">সিজন</Label>
                <div className="flex gap-2"><button onClick={() => setSeason("শীত")} className={`flex-1 py-2 rounded font-bengali text-sm ${season === "শীত" ? "bg-blue-600 text-white" : "bg-muted"}`}>❄️ শীত</button><button onClick={() => setSeason("গরম")} className={`flex-1 py-2 rounded font-bengali text-sm ${season === "গরম" ? "bg-orange-500 text-white" : "bg-muted"}`}>☀️ গরম</button></div></div>
              <div><Label className="font-bengali text-sm">লোকেশন</Label>
                <Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{locations?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name_bn}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-bengali text-sm">কার্টন</Label><Input type="number" value={cartons || ""} onChange={(e) => setCartons(+e.target.value)} /></div>
                <div><Label className="font-bengali text-sm">জোড়া</Label><Input type="number" value={pairs || ""} onChange={(e) => setPairs(+e.target.value)} /></div>
              </div>
              <div><Label className="font-bengali text-sm">কারণ</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button onClick={() => saveMut.mutate()} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bengali">সংরক্ষণ করুন</Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="font-bengali">বাতিল</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="font-bengali">তারিখ</TableHead><TableHead className="font-bengali">আর্টিকেল</TableHead><TableHead className="font-bengali">রঙ</TableHead>
            <TableHead className="font-bengali">সিজন</TableHead><TableHead className="font-bengali text-right">কার্টন</TableHead><TableHead className="font-bengali text-right">জোড়া</TableHead><TableHead className="font-bengali">কারণ</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {damages?.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center font-bengali py-6">কোনো ড্যামেজ নেই</TableCell></TableRow> :
              damages?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">{d.date}</TableCell>
                  <TableCell className="text-xs font-mono">{(d as any).articles?.article_no || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{(d as any).colors?.name_bn || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{d.season || "-"}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(d.cartons || 0)}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(d.pairs || 0)}</TableCell>
                  <TableCell className="text-xs">{d.reason || "-"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DamagePage;
