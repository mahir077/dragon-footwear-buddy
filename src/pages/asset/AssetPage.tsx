import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Printer } from "lucide-react";

interface Props {
  assetType: "machinery" | "furniture";
  title: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  active: { label: "সক্রিয়", variant: "default" },
  damaged: { label: "ক্ষতিগ্রস্ত", variant: "destructive" },
  sold: { label: "বিক্রিত", variant: "secondary" },
};

const AssetPage = ({ assetType, title }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name_bn: "", code: "", location: "", purchase_date: "",
    original_price: "", depreciation_pct: "", yearly_maintenance: "", status: "active", note: "",
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets", assetType],
    queryFn: async () => {
      const { data } = await supabase.from("assets").select("*").eq("type", assetType).order("name_bn");
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const payload = {
        name_bn: f.name_bn, code: f.code || null, location: f.location || null,
        purchase_date: f.purchase_date || null, original_price: Number(f.original_price) || 0,
        depreciation_pct: Number(f.depreciation_pct) || 0, yearly_maintenance: Number(f.yearly_maintenance) || 0,
        status: f.status, note: f.note || null, type: assetType,
      };
      if (editId) {
        const { error } = await supabase.from("assets").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", assetType] });
      toast.success(editId ? "সংশোধিত হয়েছে" : "যোগ হয়েছে");
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ name_bn: "", code: "", location: "", purchase_date: "", original_price: "", depreciation_pct: "", yearly_maintenance: "", status: "active", note: "" });
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({
      name_bn: a.name_bn, code: a.code || "", location: a.location || "",
      purchase_date: a.purchase_date || "", original_price: String(a.original_price || 0),
      depreciation_pct: String(a.depreciation_pct || 0), yearly_maintenance: String(a.yearly_maintenance || 0),
      status: a.status || "active", note: a.note || "",
    });
    setOpen(true);
  };

  const calcCurrentValue = (a: any) => {
    const price = Number(a.original_price) || 0;
    const dep = Number(a.depreciation_pct) || 0;
    const maint = Number(a.yearly_maintenance) || 0;
    const purchaseYear = a.purchase_date ? new Date(a.purchase_date).getFullYear() : new Date().getFullYear();
    const yearsUsed = Math.max(0, new Date().getFullYear() - purchaseYear);
    return Math.max(0, price - (price * dep / 100 * yearsUsed) - maint);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />নতুন যোগ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "সম্পাদনা" : "নতুন যোগ করুন"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>নাম (বাংলা)</Label><Input value={form.name_bn} onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))} /></div>
                <div><Label>কোড</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
                <div><Label>লোকেশন</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
                <div><Label>ক্রয় তারিখ</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} /></div>
                <div><Label>ক্রয়মূল্য</Label><Input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} /></div>
                <div><Label>Depreciation %</Label><Input type="number" value={form.depreciation_pct} onChange={e => setForm(p => ({ ...p, depreciation_pct: e.target.value }))} /></div>
                <div><Label>বার্ষিক মেইনটেন্যান্স</Label><Input type="number" value={form.yearly_maintenance} onChange={e => setForm(p => ({ ...p, yearly_maintenance: e.target.value }))} /></div>
                <div>
                  <Label>স্ট্যাটাস</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">সক্রিয়</SelectItem>
                      <SelectItem value="damaged">ক্ষতিগ্রস্ত</SelectItem>
                      <SelectItem value="sold">বিক্রিত</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>নোট</Label><Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
              </div>
              <Button className="mt-3 w-full" onClick={() => mutation.mutate(form)} disabled={!form.name_bn}>সংরক্ষণ</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>কোড</TableHead>
              <TableHead>নাম</TableHead>
              <TableHead>লোকেশন</TableHead>
              <TableHead className="text-right">ক্রয়মূল্য</TableHead>
              <TableHead className="text-right">Dep%</TableHead>
              <TableHead className="text-right">মেইনটেন্যান্স</TableHead>
              <TableHead className="text-right">বর্তমান মূল্য</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((a: any) => {
              const st = statusMap[a.status || "active"] || statusMap.active;
              return (
                <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(a)}>
                  <TableCell className="font-mono text-xs">{a.code || "—"}</TableCell>
                  <TableCell className="font-medium">{a.name_bn}</TableCell>
                  <TableCell>{a.location || "—"}</TableCell>
                  <TableCell className="text-right">{Number(a.original_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{a.depreciation_pct}%</TableCell>
                  <TableCell className="text-right">{Number(a.yearly_maintenance || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{Math.round(calcCurrentValue(a)).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                </TableRow>
              );
            })}
            {assets.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">কোনো তথ্য নেই</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssetPage;
