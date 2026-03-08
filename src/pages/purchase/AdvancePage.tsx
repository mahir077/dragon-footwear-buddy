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

const AdvancePage = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [suppId, setSuppId] = useState("");
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("given");
  const [note, setNote] = useState("");

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]);
      return data || [];
    },
  });

  const { data: advances } = useQuery({
    queryKey: ["supplier_advances"],
    queryFn: async () => {
      const { data } = await supabase.from("supplier_advances").select("*, parties:supplier_id(name)").order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("supplier_advances").insert({
        supplier_id: suppId,
        amount,
        type,
        date: format(new Date(), "yyyy-MM-dd"),
        note,
        year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("সফলভাবে সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["supplier_advances"] });
      setOpen(false); setSuppId(""); setAmount(0); setNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Running balance per supplier
  const balMap: Record<string, number> = {};
  advances?.forEach((a) => {
    const sid = a.supplier_id || "";
    if (!balMap[sid]) balMap[sid] = 0;
    balMap[sid] += a.type === "given" ? Number(a.amount) : -Number(a.amount);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">অগ্রিম</h1>
          <p className="text-xs text-muted-foreground">Supplier Advance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bengali text-sm"><Plus className="w-4 h-4 mr-1" /> নতুন অগ্রিম</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-bengali">অগ্রিম এন্ট্রি</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="font-bengali text-sm">সরবরাহকারী</Label>
                <Select value={suppId} onValueChange={setSuppId}>
                  <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                  <SelectContent>{suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bengali text-sm">ধরন</Label>
                <div className="flex gap-2">
                  <button onClick={() => setType("given")} className={`flex-1 py-2 rounded font-bengali text-sm ${type === "given" ? "bg-blue-600 text-white" : "bg-muted"}`}>দেওয়া</button>
                  <button onClick={() => setType("returned")} className={`flex-1 py-2 rounded font-bengali text-sm ${type === "returned" ? "bg-green-600 text-white" : "bg-muted"}`}>ফেরত</button>
                </div>
              </div>
              <div><Label className="font-bengali text-sm">পরিমাণ</Label><Input type="number" value={amount || ""} onChange={(e) => setAmount(+e.target.value)} /></div>
              <div><Label className="font-bengali text-sm">নোট</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
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
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">সরবরাহকারী</TableHead>
              <TableHead className="font-bengali text-right">দেওয়া</TableHead>
              <TableHead className="font-bengali text-right">ফেরত</TableHead>
              <TableHead className="font-bengali text-right">ব্যালেন্স</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {advances?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center font-bengali py-6">কোনো অগ্রিম নেই</TableCell></TableRow>
            ) : advances?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs">{a.date}</TableCell>
                <TableCell className="text-xs font-bengali">{(a as any).parties?.name || "-"}</TableCell>
                <TableCell className="text-right text-xs">{a.type === "given" ? `৳${toBn(Number(a.amount))}` : "-"}</TableCell>
                <TableCell className="text-right text-xs">{a.type === "returned" ? `৳${toBn(Number(a.amount))}` : "-"}</TableCell>
                <TableCell className="text-right text-xs font-bold">৳{toBn(balMap[a.supplier_id || ""] || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdvancePage;
