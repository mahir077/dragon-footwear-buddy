import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import SetupPageWrapper from "@/components/setup/SetupPageWrapper";
import DeleteConfirmDialog from "@/components/setup/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, MoreVertical, Eye, ArrowDownCircle, ArrowUpCircle, Gift, DollarSign, X } from "lucide-react";

const typeOptions = [
  { value: "customer", bn: "ক্রেতা", en: "Customer" },
  { value: "supplier", bn: "সরবরাহকারী", en: "Supplier" },
  { value: "both", bn: "উভয়", en: "Both" },
];

const modalConfig: any = {
  receipt: { title: "💰 টাকা আদায়", color: "bg-green-600", label: "আদায়ের পরিমাণ" },
  payment: { title: "💸 টাকা প্রদান", color: "bg-red-600", label: "প্রদানের পরিমাণ" },
  advance: { title: "💵 অগ্রিম", color: "bg-blue-600", label: "অগ্রিম পরিমাণ" },
  dismiss: { title: "🧾 বাকি মাফ", color: "bg-orange-600", label: "মাফের পরিমাণ" },
};

const PartiesPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("customer");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [form, setForm] = useState({ name: "", address: "", mobile: "", type: "customer", opening_balance: 0 });
  const [actionModal, setActionModal] = useState<{ partyId: string; partyName: string; type: "receipt" | "payment" | "advance" | "dismiss" } | null>(null);
  const [actionAmount, setActionAmount] = useState(0);
  const [actionNote, setActionNote] = useState("");
  const [actionMode, setActionMode] = useState("cash");

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parties").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: ["all-party-balances"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("v_party_balance").select("*");
      return data || [];
    },
  });

  const { data: years } = useQuery({
    queryKey: ["active-year"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single();
      return data;
    },
  });

  const getBalance = (partyId: string) => {
    const b = balances.find((b: any) => b.party_id === partyId);
    return b?.current_balance || 0;
  };

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
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!deleteId) return; const { error } = await supabase.from("parties").delete().eq("id", deleteId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); setDeleteOpen(false); toast({ title: "সফলভাবে মুছে ফেলা হয়েছে ✅" }); },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!actionModal || !actionAmount || actionAmount <= 0) throw new Error("সঠিক পরিমাণ দিন");
      await (supabase as any).from("party_payments").insert({
        date: format(new Date(), "yyyy-MM-dd"),
        party_id: actionModal.partyId,
        type: actionModal.type === "payment" ? "payment" : "receipt",
        amount: actionAmount,
        payment_mode: actionMode,
        note: actionNote || actionModal.type,
        year_id: years?.id || null,
      });
      await supabase.from("daily_transactions").insert({
        date: format(new Date(), "yyyy-MM-dd"),
        type: actionModal.type === "payment" ? "expense" : "income",
        amount: actionAmount,
        note: `${actionModal.type === "receipt" ? "আদায়" : actionModal.type === "payment" ? "প্রদান" : actionModal.type === "advance" ? "অগ্রিম" : "মাফ"} - ${actionModal.partyName}${actionNote ? " | " + actionNote : ""}`,
        year_id: years?.id || null,
      });
    },
    onSuccess: () => {
      toast({ title: "সফল ✅" });
      qc.invalidateQueries({ queryKey: ["all-party-balances"] });
      qc.invalidateQueries({ queryKey: ["parties"] });
      setActionModal(null);
      setActionAmount(0);
      setActionNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditing(null); setForm({ name: "", address: "", mobile: "", type: "customer", opening_balance: 0 }); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, address: p.address || "", mobile: p.mobile || "", type: p.type || "customer", opening_balance: p.opening_balance || 0 }); setModalOpen(true); };

  const handleMenuOpen = (e: React.MouseEvent, partyId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom, right: window.innerWidth - rect.right });
    setOpenMenu(partyId);
  };

  const openParty = parties.find((p: any) => p.id === openMenu);

  const renderTable = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bengali text-base">নাম</TableHead>
            <TableHead className="font-bengali text-base">মোবাইল</TableHead>
            <TableHead className="font-bengali text-base text-right">Opening</TableHead>
            <TableHead className="font-bengali text-base text-right">বর্তমান বাকি</TableHead>
            <TableHead className="w-16 text-center font-bengali text-base">অ্যাকশন</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p: any) => {
            const bal = getBalance(p.id);
            return (
              <TableRow key={p.id} className={bal > 0 ? "bg-red-50 dark:bg-red-950/20" : bal < 0 ? "bg-blue-50 dark:bg-blue-950/20" : ""}>
                <TableCell>
                  <p className="font-bengali font-bold">{p.name}</p>
                  {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                </TableCell>
                <TableCell>{p.mobile || "—"}</TableCell>
                <TableCell className="text-right">৳{(p.opening_balance || 0).toLocaleString()}</TableCell>
                <TableCell className={`text-right font-bold font-bengali ${bal > 0 ? "text-red-600" : bal < 0 ? "text-blue-600" : "text-green-600"}`}>
                  {bal > 0
                    ? (p.type === "supplier" ? "দেনা " : "পাওনা ")
                    : bal < 0
                    ? "অগ্রিম "
                    : "✓ "}৳{Math.abs(bal).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <button onClick={(e) => handleMenuOpen(e, p.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">কোনো পার্টি নেই</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
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
      </SetupPageWrapper>

      {/* Dropdown Menu — fixed position */}
      {openMenu && openParty && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div className="fixed z-50 bg-card border rounded-xl shadow-xl w-48 py-1 text-left"
            style={{ top: menuPos.top + 4, right: menuPos.right }}>
            <button onClick={() => { navigate(`/party/ledger?party=${openParty.id}`); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <Eye className="w-4 h-4 text-blue-500" /> লেজার দেখুন
            </button>
            <button onClick={() => { setActionModal({ partyId: openParty.id, partyName: openParty.name, type: "receipt" }); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <ArrowDownCircle className="w-4 h-4 text-green-500" /> টাকা আদায়
            </button>
            <button onClick={() => { setActionModal({ partyId: openParty.id, partyName: openParty.name, type: "payment" }); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <ArrowUpCircle className="w-4 h-4 text-red-500" /> টাকা প্রদান
            </button>
            <button onClick={() => { setActionModal({ partyId: openParty.id, partyName: openParty.name, type: "advance" }); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <Gift className="w-4 h-4 text-blue-500" /> অগ্রিম
            </button>
            <button onClick={() => { setActionModal({ partyId: openParty.id, partyName: openParty.name, type: "dismiss" }); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <DollarSign className="w-4 h-4 text-orange-500" /> বাকি মাফ
            </button>
            <hr className="my-1" />
            <button onClick={() => { openEdit(openParty); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted font-bengali text-sm">
              <Pencil className="w-4 h-4 text-gray-500" /> এডিট
            </button>
            <button onClick={() => { setDeleteId(openParty.id); setDeleteOpen(true); setOpenMenu(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-destructive font-bengali text-sm">
              <Trash2 className="w-4 h-4" /> মুছুন
            </button>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bengali">{editing ? "পার্টি সম্পাদনা" : "নতুন পার্টি"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><label className="font-bengali text-base font-medium block mb-1">নাম</label>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="font-bengali text-base font-medium block mb-1">ঠিকানা</label>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="font-bengali text-base font-medium block mb-1">মোবাইল</label>
              <input className="w-full border rounded-lg px-4 py-3 text-base" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            <div><label className="font-bengali text-base font-medium block mb-1">ধরন</label>
              <select className="w-full border rounded-lg px-4 py-3 text-base" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.bn} ({t.en})</option>)}
              </select></div>
            <div><label className="font-bengali text-base font-medium block mb-1">Opening Balance</label>
              <input type="number" className="w-full border rounded-lg px-4 py-3 text-base" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })} /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}
                className="flex-1 bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-lg text-base font-bengali font-semibold hover:opacity-90 disabled:opacity-50">
                {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-lg text-base font-bengali bg-muted hover:opacity-80">বাতিল</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deleteMutation.mutate()} loading={deleteMutation.isPending} />

      {/* Quick Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-bengali">{modalConfig[actionModal.type].title}</h2>
              <button onClick={() => setActionModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm font-bengali text-muted-foreground font-bold">{actionModal.partyName}</p>
            <div>
              <label className="text-xs font-bengali text-muted-foreground">{modalConfig[actionModal.type].label} (৳)</label>
              <Input type="number" value={actionAmount || ""} onChange={e => setActionAmount(Number(e.target.value))}
                className="text-2xl font-bold h-14 mt-1" placeholder="০" autoFocus />
            </div>
            <div className="flex gap-2">
              {["cash", "bank", "mobile"].map(m => (
                <button key={m} onClick={() => setActionMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 transition-all ${actionMode === m ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {m === "cash" ? "নগদ" : m === "bank" ? "ব্যাংক" : "মোবাইল"}
                </button>
              ))}
            </div>
            <Input value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="নোট (ঐচ্ছিক)" className="font-bengali" />
            <button onClick={() => actionMutation.mutate()} disabled={actionMutation.isPending}
              className={`w-full py-3 rounded-xl text-white font-bold font-bengali text-lg ${modalConfig[actionModal.type].color}`}>
              {actionMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PartiesPage;