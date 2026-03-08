import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

type Brand = { id: string; name_bn: string; name_en: string | null; is_active: boolean | null };

const BrandsPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_bn: "", name_en: "", is_active: true });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name_bn");
      if (error) throw error;
      return data as Brand[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("brands").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setModalOpen(false);
      toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" });
    },
    onError: (e) => toast({ title: "ত্রুটি হয়েছে", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return;
      const { error } = await supabase.from("brands").delete().eq("id", deleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      setDeleteOpen(false);
      toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" });
    },
    onError: (e) => toast({ title: "ত্রুটি হয়েছে", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name_bn: "", name_en: "", is_active: true });
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name_bn: b.name_bn, name_en: b.name_en || "", is_active: b.is_active ?? true });
    setModalOpen(true);
  };

  return (
    <SetupPageWrapper titleBn="ব্র্যান্ড" titleEn="Brands" onAdd={openAdd}>
      {isLoading ? (
        <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">বাংলা নাম</TableHead>
                <TableHead className="font-bengali text-base">English নাম</TableHead>
                <TableHead className="font-bengali text-base">স্ট্যাটাস</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bengali text-base font-medium">{b.name_bn}</TableCell>
                  <TableCell className="text-base">{b.name_en || "—"}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm font-bengali ${b.is_active ? "bg-[hsl(var(--stat-green))]/10 text-[hsl(var(--stat-green))]" : "bg-muted text-muted-foreground"}`}>
                      {b.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { setDeleteId(b.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {brands.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center font-bengali py-8 text-muted-foreground">কোনো ব্র্যান্ড নেই</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bengali">{editing ? "ব্র্যান্ড সম্পাদনা" : "নতুন ব্র্যান্ড"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">বাংলা নাম</label>
              <p className="text-xs text-muted-foreground mb-1">Bengali Name</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">English নাম</label>
              <p className="text-xs text-muted-foreground mb-1">English Name</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <label className="font-bengali text-base">সক্রিয়</label>
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

export default BrandsPage;
