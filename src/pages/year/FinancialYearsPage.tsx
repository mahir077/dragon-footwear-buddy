import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Lock, Unlock } from "lucide-react";

type FY = {
  id: string; name: string; start_date: string; end_date: string;
  is_active: boolean | null; is_locked: boolean | null;
};

const FinancialYearsPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<FY | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });

  const { data: years = [], isLoading } = useQuery({
    queryKey: ["financial_years"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_years").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as FY[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("financial_years").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financial_years").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_years"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("financial_years").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_years"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async (id: string) => {
      // Deactivate all first, then activate the selected one
      await supabase.from("financial_years").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("financial_years").update({ is_active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_years"] }); toast({ title: "সক্রিয় বছর পরিবর্তন হয়েছে ✅" }); },
  });

  const toggleLock = useMutation({
    mutationFn: async ({ id, lock }: { id: string; lock: boolean }) => {
      const { error } = await supabase.from("financial_years").update({ is_locked: lock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_years"] }); toast({ title: "আপডেট হয়েছে ✅" }); },
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", start_date: "", end_date: "" }); setModalOpen(true); };
  const openEdit = (y: FY) => { setEditing(y); setForm({ name: y.name, start_date: y.start_date, end_date: y.end_date }); setModalOpen(true); };

  return (
    <SetupPageWrapper titleBn="আর্থিক বছর" titleEn="Financial Years" onAdd={openAdd}>
      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">নাম</TableHead>
                <TableHead className="font-bengali text-base">শুরুর তারিখ</TableHead>
                <TableHead className="font-bengali text-base">শেষ তারিখ</TableHead>
                <TableHead className="font-bengali text-base">স্ট্যাটাস</TableHead>
                <TableHead className="w-48"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="font-bengali text-base font-medium">{y.name}</TableCell>
                  <TableCell className="text-base">{y.start_date}</TableCell>
                  <TableCell className="text-base">{y.end_date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {y.is_active && <span className="px-3 py-1 rounded-full text-sm font-bengali bg-[hsl(var(--stat-green))]/10 text-[hsl(var(--stat-green))]">সক্রিয়</span>}
                      {y.is_locked && <span className="px-3 py-1 rounded-full text-sm font-bengali bg-[hsl(var(--stat-red))]/10 text-[hsl(var(--stat-red))]">বন্ধ</span>}
                      {!y.is_active && !y.is_locked && <span className="px-3 py-1 rounded-full text-sm font-bengali bg-muted text-muted-foreground">নিষ্ক্রিয়</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {!y.is_active && (
                        <button onClick={() => toggleActive.mutate(y.id)} className="text-xs px-2 py-1 rounded bg-[hsl(var(--stat-green))]/10 text-[hsl(var(--stat-green))] font-bengali hover:opacity-80">সক্রিয় করুন</button>
                      )}
                      {y.is_locked ? (
                        <button onClick={() => toggleLock.mutate({ id: y.id, lock: false })} className="text-xs px-2 py-1 rounded bg-[hsl(var(--stat-blue))]/10 text-[hsl(var(--stat-blue))] font-bengali hover:opacity-80"><Unlock className="w-3 h-3 inline mr-1" />খুলুন</button>
                      ) : (
                        <button onClick={() => { if (confirm("বছর বন্ধ করলে আর entry করা যাবে না")) toggleLock.mutate({ id: y.id, lock: true }); }} className="text-xs px-2 py-1 rounded bg-[hsl(var(--stat-red))]/10 text-[hsl(var(--stat-red))] font-bengali hover:opacity-80"><Lock className="w-3 h-3 inline mr-1" />বন্ধ করুন</button>
                      )}
                      <button onClick={() => openEdit(y)} className="text-primary hover:opacity-70 p-1"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { setDeleteId(y.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {years.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো আর্থিক বছর নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "বছর সম্পাদনা" : "নতুন আর্থিক বছর"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">নাম</label>
              <p className="text-xs text-muted-foreground mb-1">e.g. 2025-2026</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">শুরুর তারিখ</label>
              <input type="date" className="w-full border rounded-lg px-4 py-3 text-base" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">শেষ তারিখ</label>
              <input type="date" className="w-full border rounded-lg px-4 py-3 text-base" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.start_date || !form.end_date || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
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

export default FinancialYearsPage;
