import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const FdrPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank_id: "", account_no: "", opening_balance: 0 });
  const [selectedFdr, setSelectedFdr] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({ amount: 0, note: "", type: "deposit" });
  const [txOpen, setTxOpen] = useState(false);

  const { data: banks } = useQuery({ queryKey: ["banks"], queryFn: async () => { const { data } = await supabase.from("bank_accounts").select("*"); return data || []; } });
  const { data: fdrs } = useQuery({ queryKey: ["fdrs"], queryFn: async () => { const { data } = await supabase.from("fixed_deposits").select("*, bank_accounts(bank_name)").eq("is_active", true); return data || []; } });
  const { data: transactions } = useQuery({
    queryKey: ["fdr-tx", selectedFdr],
    queryFn: async () => { if (!selectedFdr) return []; const { data } = await supabase.from("fdr_transactions").select("*").eq("fdr_id", selectedFdr).order("date"); return data || []; },
    enabled: !!selectedFdr,
  });

  const saveFdr = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("fixed_deposits").insert({ ...form, start_date: format(new Date(), "yyyy-MM-dd") }); if (error) throw error; },
    onSuccess: () => { toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["fdrs"] }); setOpen(false); },
  });

  const saveTx = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("fdr_transactions").insert({ fdr_id: selectedFdr, date: format(new Date(), "yyyy-MM-dd"), ...txForm }); if (error) throw error; },
    onSuccess: () => { toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["fdr-tx"] }); setTxOpen(false); },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">FDR / সঞ্চয়</h1><p className="text-sm text-muted-foreground">Fixed Deposits</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="font-bengali bg-success hover:bg-success/90"><Plus className="w-4 h-4 mr-1" />নতুন FDR</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle className="font-bengali">নতুন FDR</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.bank_id} onValueChange={v => setForm(p => ({ ...p, bank_id: v }))}><SelectTrigger><SelectValue placeholder="ব্যাংক" /></SelectTrigger>
                <SelectContent>{banks?.map(b => <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>)}</SelectContent></Select>
              <Input placeholder="হিসাব নং" value={form.account_no} onChange={e => setForm(p => ({ ...p, account_no: e.target.value }))} />
              <Input type="number" placeholder="Opening Balance" value={form.opening_balance || ""} onChange={e => setForm(p => ({ ...p, opening_balance: Number(e.target.value) }))} />
              <Button onClick={() => saveFdr.mutate()} className="w-full font-bengali bg-success hover:bg-success/90">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {fdrs?.map(fdr => {
          const deposits = transactions?.filter(tx => tx.fdr_id === fdr.id && tx.type === "deposit").reduce((s, tx) => s + tx.amount, 0) || 0;
          const withdrawals = transactions?.filter(tx => tx.fdr_id === fdr.id && tx.type === "withdrawal").reduce((s, tx) => s + tx.amount, 0) || 0;
          const balance = (fdr.opening_balance || 0) + deposits - withdrawals;
          return (
            <div key={fdr.id} onClick={() => setSelectedFdr(fdr.id)} className={`bg-card border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selectedFdr === fdr.id ? "ring-2 ring-primary" : ""}`}>
              <div className="flex justify-between">
                <div><p className="font-bold font-bengali">{(fdr as any).bank_accounts?.bank_name}</p><p className="text-xs text-muted-foreground">{fdr.account_no}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground">ব্যালেন্স</p><p className="font-bold text-primary font-bengali">৳{balance.toLocaleString()}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedFdr && (
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold font-bengali">লেনদেন</h3>
            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogTrigger asChild><Button size="sm" className="font-bengali bg-success hover:bg-success/90"><Plus className="w-3 h-3 mr-1" />লেনদেন</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle className="font-bengali">লেনদেন এন্ট্রি</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={() => setTxForm(p => ({ ...p, type: "deposit" }))} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 ${txForm.type === "deposit" ? "border-success bg-success/10" : "border-border"}`}>জমা</button>
                    <button onClick={() => setTxForm(p => ({ ...p, type: "withdrawal" }))} className={`flex-1 py-2 rounded-lg text-sm font-bengali font-bold border-2 ${txForm.type === "withdrawal" ? "border-destructive bg-destructive/10" : "border-border"}`}>উত্তোলন</button>
                  </div>
                  <Input type="number" placeholder="পরিমাণ" value={txForm.amount || ""} onChange={e => setTxForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                  <Input placeholder="নোট" value={txForm.note} onChange={e => setTxForm(p => ({ ...p, note: e.target.value }))} />
                  <Button onClick={() => saveTx.mutate()} className="w-full font-bengali bg-success hover:bg-success/90">সংরক্ষণ করুন</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="font-bengali"><th className="p-2 text-left">তারিখ</th><th className="p-2 text-left">ধরন</th><th className="p-2 text-right">পরিমাণ</th><th className="p-2 text-left">নোট</th></tr></thead>
            <tbody>{transactions?.map(tx => <tr key={tx.id} className="border-t"><td className="p-2">{tx.date}</td><td className="p-2 font-bengali">{tx.type === "deposit" ? "জমা" : "উত্তোলন"}</td><td className={`p-2 text-right font-bold ${tx.type === "deposit" ? "text-success" : "text-destructive"}`}>৳{tx.amount.toLocaleString()}</td><td className="p-2">{tx.note}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FdrPage;
