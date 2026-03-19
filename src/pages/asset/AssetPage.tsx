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
import { Plus, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { journalAssetPurchase, journalDepreciation, journalAssetDisposal } from "@/lib/autoJournal";

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
  const [disposalOpen, setDisposalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name_bn: "", code: "", location: "", purchase_date: "",
    original_price: "", depreciation_pct: "", yearly_maintenance: "", status: "active", note: "",
  });
  const [disposalForm, setDisposalForm] = useState({
    sale_amount: "", disposal_date: format(new Date(), "yyyy-MM-dd"), disposal_type: "sold", note: "",
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets", assetType],
    queryFn: async () => {
      const { data } = await supabase.from("assets").select("*").eq("type", assetType).order("name_bn");
      return data || [];
    },
  });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
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
        return null;
      } else {
        const { data: asset, error } = await supabase.from("assets").insert(payload).select().single();
        if (error) throw error;
        return asset;
      }
    },
    onSuccess: async (data) => {
  if (data && !editId && Number(form.original_price) > 0) {
    const dateStr = form.purchase_date || format(new Date(), "yyyy-MM-dd");
    await journalAssetPurchase(data.id, dateStr, Number(form.original_price), assetType, activeYear?.id);
    const price = Number(form.original_price) || 0;
    const dep = Number(form.depreciation_pct) || 0;
    const deprAmount = Math.round(price * dep / 100);
    if (deprAmount > 0) await journalDepreciation(data.id, dateStr, deprAmount, activeYear?.id);
  }
      qc.invalidateQueries({ queryKey: ["assets", assetType] });
      toast.success(editId ? "সংশোধিত হয়েছে" : "যোগ হয়েছে");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ✅ Disposal mutation
  const disposalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAsset) throw new Error("Asset not found");
      const saleAmount = Number(disposalForm.sale_amount) || 0;
      const bookValue = calcCurrentValue(selectedAsset);
      const newStatus = disposalForm.disposal_type === "sold" ? "sold" : "damaged";

      const { error } = await supabase.from("assets").update({
        status: newStatus,
        note: disposalForm.note || selectedAsset.note,
      }).eq("id", selectedAsset.id);
      if (error) throw error;

      return { id: selectedAsset.id, saleAmount, bookValue };
    },
    onSuccess: async (data) => {
  if (data.saleAmount > 0 || data.bookValue > 0) {
    await journalAssetDisposal(
          data.id,
          disposalForm.disposal_date,
          data.saleAmount,
          data.bookValue,
          activeYear?.id
        );
      }
      qc.invalidateQueries({ queryKey: ["assets", assetType] });
      toast.success("সম্পদ disposal সম্পন্ন ✅");
      setDisposalOpen(false);
      setSelectedAsset(null);
      setDisposalForm({ sale_amount: "", disposal_date: format(new Date(), "yyyy-MM-dd"), disposal_type: "sold", note: "" });
    },
    onError: (e: any) => toast.error(e.message),
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

  const openDisposal = (a: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAsset(a);
    setDisposalOpen(true);
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

      {/* ✅ Disposal Dialog */}
      <Dialog open={disposalOpen} onOpenChange={setDisposalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bengali">সম্পদ Disposal — {selectedAsset?.name_bn}</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-3 text-sm font-bengali space-y-1">
                <p>ক্রয়মূল্য: <span className="font-bold">৳{Number(selectedAsset.original_price || 0).toLocaleString()}</span></p>
                <p>বর্তমান মূল্য (Book Value): <span className="font-bold text-primary">৳{Math.round(calcCurrentValue(selectedAsset)).toLocaleString()}</span></p>
              </div>
              <div>
                <Label className="font-bengali">ধরন</Label>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setDisposalForm(p => ({ ...p, disposal_type: "sold" }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${disposalForm.disposal_type === "sold" ? "border-green-500 bg-green-50 text-green-700" : "border-border"}`}>
                    💰 বিক্রয়
                  </button>
                  <button onClick={() => setDisposalForm(p => ({ ...p, disposal_type: "damaged" }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${disposalForm.disposal_type === "damaged" ? "border-red-500 bg-red-50 text-red-700" : "border-border"}`}>
                    💔 নষ্ট/ক্ষতি
                  </button>
                </div>
              </div>
              <div>
                <Label className="font-bengali">তারিখ</Label>
                <Input type="date" value={disposalForm.disposal_date} onChange={e => setDisposalForm(p => ({ ...p, disposal_date: e.target.value }))} />
              </div>
              {disposalForm.disposal_type === "sold" && (
                <div>
                  <Label className="font-bengali">বিক্রয় মূল্য (৳)</Label>
                  <Input type="number" value={disposalForm.sale_amount} onChange={e => setDisposalForm(p => ({ ...p, sale_amount: e.target.value }))} placeholder="০" />
                </div>
              )}
              <div>
                <Label className="font-bengali">নোট</Label>
                <Input value={disposalForm.note} onChange={e => setDisposalForm(p => ({ ...p, note: e.target.value }))} placeholder="ঐচ্ছিক" />
              </div>

              {/* Gain/Loss preview */}
              {disposalForm.disposal_type === "sold" && Number(disposalForm.sale_amount) > 0 && (
                <div className={`p-3 rounded-lg text-sm font-bengali font-bold ${Number(disposalForm.sale_amount) >= calcCurrentValue(selectedAsset) ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {Number(disposalForm.sale_amount) >= calcCurrentValue(selectedAsset)
                    ? `✅ লাভ: ৳${Math.round(Number(disposalForm.sale_amount) - calcCurrentValue(selectedAsset)).toLocaleString()}`
                    : `❌ ক্ষতি: ৳${Math.round(calcCurrentValue(selectedAsset) - Number(disposalForm.sale_amount)).toLocaleString()}`}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => disposalMutation.mutate()} disabled={disposalMutation.isPending}
                  className="flex-1 font-bengali bg-destructive hover:bg-destructive/90">
                  {disposalMutation.isPending ? "হচ্ছে..." : "Disposal নিশ্চিত করুন"}
                </Button>
                <Button variant="outline" onClick={() => setDisposalOpen(false)} className="font-bengali">বাতিল</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <TableHead className="text-center">Disposal</TableHead>
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
                  <TableCell className="text-center">
                    {a.status === "active" && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => openDisposal(a, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {assets.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো তথ্য নেই</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssetPage;