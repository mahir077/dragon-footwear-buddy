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

const EmployeesPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", mobile: "", join_date: "", basic_salary: 0, is_active: true });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, address: form.address || null, mobile: form.mobile || null, join_date: form.join_date || null, basic_salary: form.basic_salary, is_active: form.is_active };
      if (editing) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("employees").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", address: "", mobile: "", join_date: "", basic_salary: 0, is_active: true }); setModalOpen(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ name: e.name, address: e.address || "", mobile: e.mobile || "", join_date: e.join_date || "", basic_salary: e.basic_salary || 0, is_active: e.is_active ?? true }); setModalOpen(true); };

  return (
    <SetupPageWrapper titleBn="কর্মচারী" titleEn="Employees" onAdd={openAdd}>
      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bengali text-base">নাম</TableHead>
                <TableHead className="font-bengali text-base">ঠিকানা</TableHead>
                <TableHead className="font-bengali text-base">মোবাইল</TableHead>
                <TableHead className="font-bengali text-base">যোগদানের তারিখ</TableHead>
                <TableHead className="font-bengali text-base">মূল বেতন</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-bengali text-base font-medium">{e.name}</TableCell>
                  <TableCell className="text-base">{e.address || "—"}</TableCell>
                  <TableCell className="text-base">{e.mobile || "—"}</TableCell>
                  <TableCell className="text-base">{e.join_date || "—"}</TableCell>
                  <TableCell className="text-base">৳{e.basic_salary || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(e)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                      <button onClick={() => { setDeleteId(e.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && <TableRow><TableCell colSpan={6} className="text-center font-bengali py-8 text-muted-foreground">কোনো কর্মচারী নেই</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "কর্মচারী সম্পাদনা" : "নতুন কর্মচারী"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-bengali text-base font-medium block mb-1">নাম</label>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">ঠিকানা</label>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">মোবাইল</label>
              <p className="text-xs text-muted-foreground mb-1">Mobile</p>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">যোগদানের তারিখ</label>
              <p className="text-xs text-muted-foreground mb-1">Join Date</p>
              <input type="date" className="w-full border rounded-lg px-4 py-3 text-base" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">মূল বেতন</label>
              <p className="text-xs text-muted-foreground mb-1">Basic Salary</p>
              <input type="number" className="w-full border rounded-lg px-4 py-3 text-base" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <label className="font-bengali text-base">সক্রিয়</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
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

export default EmployeesPage;
