import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";

const typeOptions = [
  { value: "customer", bn: "ক্রেতা", en: "Customer" },
  { value: "supplier", bn: "সরবরাহকারী", en: "Supplier" },
  { value: "both", bn: "উভয়", en: "Both" },
];

const PartiesPage = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("customer");
  const [form, setForm] = useState({ name: "", address: "", mobile: "", type: "customer", opening_balance: 0 });

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parties").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = parties.filter((p: any) => {
    if (activeTab === "customer") return p.type === "customer" || p.type === "both";
    if (activeTab === "supplier") return p.type === "supplier" || p.type === "both";
    return p.type === "both";
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, address: form.address || null, mobile: form.mobile || null, type: form.type, opening_balance: form.opening_balance };
      if (editing) {
        const { error } = await supabase.from("parties").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); setModalOpen(false); toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("parties").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", address: "", mobile: "", type: "customer", opening_balance: 0 }); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, address: p.address || "", mobile: p.mobile || "", type: p.type || "customer", opening_balance: p.opening_balance || 0 }); setModalOpen(true); };

  const renderTable = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bengali text-base">নাম</TableHead>
            <TableHead className="font-bengali text-base">ঠিকানা</TableHead>
            <TableHead className="font-bengali text-base">মোবাইল</TableHead>
            <TableHead className="font-bengali text-base">Opening Balance</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="font-bengali text-base font-medium">{p.name}</TableCell>
              <TableCell className="text-base">{p.address || "—"}</TableCell>
              <TableCell className="text-base">{p.mobile || "—"}</TableCell>
              <TableCell className="text-base">৳{p.opening_balance || 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-primary hover:opacity-70 p-2"><Pencil className="w-5 h-5" /></button>
                  <button onClick={() => { setDeleteId(p.id); setDeleteOpen(true); }} className="text-destructive hover:opacity-70 p-2"><Trash2 className="w-5 h-5" /></button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো পার্টি নেই</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <SetupPageWrapper titleBn="পার্টি" titleEn="Parties" onAdd={openAdd}>
      {isLoading ? <p className="font-bengali text-muted-foreground">লোড হচ্ছে...</p> : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="customer" className="font-bengali text-base px-6 py-2">ক্রেতা</TabsTrigger>
            <TabsTrigger value="supplier" className="font-bengali text-base px-6 py-2">সরবরাহকারী</TabsTrigger>
            <TabsTrigger value="both" className="font-bengali text-base px-6 py-2">উভয়</TabsTrigger>
          </TabsList>
          <TabsContent value="customer">{renderTable()}</TabsContent>
          <TabsContent value="supplier">{renderTable()}</TabsContent>
          <TabsContent value="both">{renderTable()}</TabsContent>
        </Tabs>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "পার্টি সম্পাদনা" : "নতুন পার্টি"}</DialogTitle></DialogHeader>
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
              <label className="font-bengali text-base font-medium block mb-1">ধরন</label>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.bn} ({t.en})</option>)}
              </select>
            </div>
            <div>
              <label className="font-bengali text-base font-medium block mb-1">Opening Balance</label>
              <input type="number" className="w-full border rounded-lg px-4 py-3 text-base" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })} />
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

export default PartiesPage;
