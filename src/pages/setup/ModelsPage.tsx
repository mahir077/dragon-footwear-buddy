import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

const seasonOptions = [
  { value: "শীত", label: "শীত (Winter)" },
  { value: "গরম", label: "গরম (Summer)" },
  { value: "উভয়", label: "উভয় (Both)" },
];

const ModelsPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [form, setForm] = useState({ name_bn: "", brand_id: "", season: "উভয়", is_active: true });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*").eq("is_active", true).order("name_bn");
      return data || [];
    },
  });

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["models", filterBrand],
    queryFn: async () => {
      let q = supabase.from("models").select("*, brands(name_bn)").order("name_bn");
      if (filterBrand) q = q.eq("brand_id", filterBrand);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name_bn: form.name_bn, brand_id: form.brand_id || null, season: form.season, is_active: form.is_active };
      if (editing) {
        const { error } = await supabase.from("models").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("models").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["models"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("models").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["models"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ name_bn: "", brand_id: "", season: "উভয়", is_active: true }); setModalOpen(true); };
  const openEdit = (m: any) => { setEditing(m); setForm({ name_bn: m.name_bn, brand_id: m.brand_id || "", season: m.season || "উভয়", is_active: m.is_active ?? true }); setModalOpen(true); };

  return (
    <SetupPageWrapper titleBn="মডেল" titleEn="Models" onAdd={openAdd}>
      <div className="mb-4">
        <label className="font-bengali text-base font-medium mr-3">ব্র্যান্ড ফিল্টার:</label>
        <select className="border rounded-lg px-4 py-2 text-base" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
          <option value="">সব ব্র্যান্ড</option>
          {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name_bn}</option>)}
        </select>
      </div>

      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">মডেলের নাম</TableHead>
                <TableHead className="font-bengali text-base">ব্র্যান্ড</TableHead>
                <TableHead className="font-bengali text-base">সিজন</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-bengali text-base font-medium">{m.name_bn}</TableCell>
                  <TableCell className="font-bengali text-base">{m.brands?.name_bn || "—"}</TableCell>
                  <TableCell className="font-bengali text-base">{m.season || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(m)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { setDeleteId(m.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {models.length === 0 && <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8 text-muted-foreground">কোনো মডেল নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "মডেল সম্পাদনা" : "নতুন মডেল"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">ব্র্যান্ড নির্বাচন</label>
              <p className="text-xs text-muted-foreground mb-1">Select Brand</p>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                <option value="">— নির্বাচন করুন —</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name_bn}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">বাংলা নাম</label>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">সিজন</label>
              <p className="text-xs text-muted-foreground mb-1">Season</p>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                {seasonOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name_bn || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
                {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-lg text-base font-bengali bg-muted hover:opacity-80">বাতিল</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deleteMutation.mutate()} loading={deleteMutation.isPending} />
    </SetupPageWrapper>
  );
};

export default ModelsPage;
