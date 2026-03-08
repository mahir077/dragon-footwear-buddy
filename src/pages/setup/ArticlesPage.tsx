import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

const seriesOptions = [
  { value: "100-199", label: "100-199" },
  { value: "200-299", label: "200-299" },
  { value: "300-399", label: "300-399" },
  { value: "3000-3999", label: "3000-3999" },
  { value: "4000-4999", label: "4000-4999" },
];

const ArticlesPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string>("");
  const [form, setForm] = useState({ article_no: "", model_id: "", series_group: "", pairs_per_carton: 24 });

  const { data: models = [] } = useQuery({
    queryKey: ["models-active"],
    queryFn: async () => {
      const { data } = await supabase.from("models").select("*, brands(name_bn)").eq("is_active", true).order("name_bn");
      return data || [];
    },
  });

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles", filterModel],
    queryFn: async () => {
      let q = supabase.from("articles").select("*, models(name_bn, brands(name_bn))").order("article_no");
      if (filterModel) q = q.eq("model_id", filterModel);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { article_no: form.article_no, model_id: form.model_id || null, series_group: form.series_group || null, pairs_per_carton: form.pairs_per_carton };
      if (editing) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("articles").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ article_no: "", model_id: "", series_group: "", pairs_per_carton: 24 }); setModalOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ article_no: a.article_no, model_id: a.model_id || "", series_group: a.series_group || "", pairs_per_carton: a.pairs_per_carton }); setModalOpen(true); };

  return (
    <SetupPageWrapper titleBn="আর্টিকেল" titleEn="Articles" onAdd={openAdd}>
      <div className="mb-4">
        <label className="font-bengali text-base font-medium mr-3">মডেল ফিল্টার:</label>
        <select className="border rounded-lg px-4 py-2 text-base" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
          <option value="">সব মডেল</option>
          {models.map((m: any) => <option key={m.id} value={m.id}>{m.name_bn} ({m.brands?.name_bn || ""})</option>)}
        </select>
      </div>

      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">আর্টিকেল নম্বর</TableHead>
                <TableHead className="font-bengali text-base">মডেল</TableHead>
                <TableHead className="font-bengali text-base">সিরিজ</TableHead>
                <TableHead className="font-bengali text-base">কার্টনে জোড়া</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="text-base font-medium">{a.article_no}</TableCell>
                  <TableCell className="font-bengali text-base">{a.models?.name_bn || "—"}</TableCell>
                  <TableCell className="text-base">{a.series_group || "—"}</TableCell>
                  <TableCell className="text-base">{a.pairs_per_carton}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { setDeleteId(a.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {articles.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো আর্টিকেল নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "আর্টিকেল সম্পাদনা" : "নতুন আর্টিকেল"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">মডেল নির্বাচন</label>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.model_id} onChange={(e) => setForm({ ...form, model_id: e.target.value })}>
                <option value="">— নির্বাচন করুন —</option>
                {models.map((m: any) => <option key={m.id} value={m.id}>{m.name_bn}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">আর্টিকেল নম্বর</label>
              <p className="text-xs text-muted-foreground mb-1">Article Number</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.article_no} onChange={(e) => setForm({ ...form, article_no: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">সিরিজ গ্রুপ</label>
              <p className="text-xs text-muted-foreground mb-1">Series Group</p>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.series_group} onChange={(e) => setForm({ ...form, series_group: e.target.value })}>
                <option value="">— নির্বাচন করুন —</option>
                {seriesOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">কার্টনে জোড়া সংখ্যা</label>
              <p className="text-xs text-muted-foreground mb-1">Pairs per Carton</p>
              <input type="number" className="w-full border rounded-lg px-4 py-3 text-base" value={form.pairs_per_carton} onChange={(e) => setForm({ ...form, pairs_per_carton: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.article_no || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
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

export default ArticlesPage;
