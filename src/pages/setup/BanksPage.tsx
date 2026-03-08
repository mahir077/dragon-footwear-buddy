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

const BanksPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ bank_name: "", branch: "", account_no: "", opening_balance: 0, is_active: true });

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*").order("bank_name");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { bank_name: form.bank_name, branch: form.branch || null, account_no: form.account_no || null, opening_balance: form.opening_balance, is_active: form.is_active };
      if (editing) {
        const { error } = await supabase.from("bank_accounts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bank_accounts"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("bank_accounts").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bank_accounts"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ bank_name: "", branch: "", account_no: "", opening_balance: 0, is_active: true }); setModalOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ bank_name: b.bank_name, branch: b.branch || "", account_no: b.account_no || "", opening_balance: b.opening_balance || 0, is_active: b.is_active ?? true }); setModalOpen(true); };

  return (
    <SetupPageWrapper titleBn="ব্যাংক হিসাব" titleEn="Bank Accounts" onAdd={openAdd}>
      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">ব্যাংকের নাম</TableHead>
                <TableHead className="font-bengali text-base">শাখা</TableHead>
                <TableHead className="font-bengali text-base">হিসাব নম্বর</TableHead>
                <TableHead className="font-bengali text-base">Opening Balance</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bengali text-base font-medium">{b.bank_name}</TableCell>
                  <TableCell className="text-base">{b.branch || "—"}</TableCell>
                  <TableCell className="text-base">{b.account_no || "—"}</TableCell>
                  <TableCell className="text-base">৳{b.opening_balance || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { setDeleteId(b.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {banks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো ব্যাংক হিসাব নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "ব্যাংক হিসাব সম্পাদনা" : "নতুন ব্যাংক হিসাব"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">ব্যাংকের নাম</label>
              <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">শাখা</label>
              <p className="text-xs text-muted-foreground mb-1">Branch</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">হিসাব নম্বর</label>
              <p className="text-xs text-muted-foreground mb-1">Account Number</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.account_no} onChange={(e) => setForm({ ...form, account_no: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">Opening Balance</label>
              <input type="number" className="w-full border rounded-lg px-4 py-3 text-base" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <label className="font-bengali text-base">সক্রিয়</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.bank_name || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
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

export default BanksPage;
