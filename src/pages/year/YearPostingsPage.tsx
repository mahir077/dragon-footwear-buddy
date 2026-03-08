import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

const bengaliMonths = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const YearPostingsPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ month: 1, posting_date: "", note: "" });

  const { data: activeYear } = useQuery({
    queryKey: ["active_financial_year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  const { data: postings = [], isLoading } = useQuery({
    queryKey: ["year_postings", activeYear?.id],
    enabled: !!activeYear?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("year_postings").select("*").eq("year_id", activeYear!.id).order("month");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("year_postings").insert({ ...form, year_id: activeYear?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["year_postings"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const toggleLock = useMutation({
    mutationFn: async ({ id, lock }: { id: string; lock: boolean }) => {
      const { error } = await supabase.from("year_postings").update({ is_locked: lock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["year_postings"] }); toast({ title: "আপডেট হয়েছে ✅" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("year_postings").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["year_postings"] }); setDeleteOpen(false); toast({ title: "মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  return (
    <SetupPageWrapper titleBn="মাসিক পোস্টিং" titleEn="Monthly Postings" onAdd={() => { setForm({ month: 1, posting_date: new Date().toISOString().slice(0, 10), note: "" }); setModalOpen(true); }}>
      {!activeYear ? (
        <div className="bg-[hsl(var(--stat-red))]/10 border border-[hsl(var(--stat-red))]/30 rounded-xl p-6 text-center">
          <p className="font-bengali text-lg text-[hsl(var(--stat-red))]">কোনো সক্রিয় আর্থিক বছর নেই। প্রথমে একটি বছর সক্রিয় করুন।</p>
        </div>
      ) : (
        <>
          <div className="bg-[hsl(var(--stat-blue))]/10 border border-[hsl(var(--stat-blue))]/30 rounded-xl p-4 mb-4">
            <p className="font-bengali text-base">সক্রিয় বছর: <strong>{activeYear.name}</strong></p>
          </div>
          {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bengali text-base">মাস</TableHead>
                    <TableHead className="font-bengali text-base">তারিখ</TableHead>
                    <TableHead className="font-bengali text-base">স্ট্যাটাস</TableHead>
                    <TableHead className="font-bengali text-base">নোট</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postings.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bengali text-base font-medium">{bengaliMonths[(p.month - 1) % 12]}</TableCell>
                      <TableCell className="text-base">{p.posting_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={!p.is_locked} onCheckedChange={(v) => toggleLock.mutate({ id: p.id, lock: !v })} />
                          <span className={`text-sm font-bengali ${p.is_locked ? "text-[hsl(var(--stat-red))]" : "text-[hsl(var(--stat-green))]"}`}>
                            {p.is_locked ? "বন্ধ" : "খোলা"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.note || "—"}</TableCell>
                      <TableCell>
                        <button onClick={() => { setDeleteId(p.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {postings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো পোস্টিং নেই</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">নতুন পোস্টিং</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">মাস</label>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
                {bengaliMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">তারিখ</label>
              <input type="date" className="w-full border rounded-lg px-4 py-3 text-base" value={form.posting_date} onChange={(e) => setForm({ ...form, posting_date: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">নোট</label>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.posting_date || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
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

export default YearPostingsPage;
