import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const LoanLentPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ party_name: "", address: "", mobile: "", opening_balance: 0, interest_rate: 0, loan_type: "personal" });
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({ amount: 0, note: "", type: "collection" });
  const [txOpen, setTxOpen] = useState(false);

  const { data: loans } = useQuery({
    queryKey: ["loans-lent"],
    queryFn: async () => { const { data } = await supabase.from("loans").select("*").eq("direction", "lent").eq("is_active", true); return data || []; },
  });

  const { data: transactions } = useQuery({
    queryKey: ["loan-lent-tx", selectedLoan],
    queryFn: async () => { if (!selectedLoan) return []; const { data } = await supabase.from("loan_transactions").select("*").eq("loan_id", selectedLoan).order("date"); return data || []; },
    enabled: !!selectedLoan,
  });

  const saveLoan = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("loans").insert({ ...form, direction: "lent" }); if (error) throw error; },
    onSuccess: () => { toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["loans-lent"] }); setOpen(false); },
  });

  const saveTx = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("loan_transactions").insert({ loan_id: selectedLoan, date: format(new Date(), "yyyy-MM-dd"), ...txForm }); if (error) throw error; },
    onSuccess: () => { toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["loan-lent-tx"] }); setTxOpen(false); },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">লোন দেওয়া</h1><p className="text-sm text-muted-foreground">Lent Loans</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="font-bengali bg-success hover:bg-success/90"><Plus className="w-4 h-4 mr-1" />নতুন</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle className="font-bengali">নতুন লোন দেওয়া</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="কার নামে" value={form.party_name} onChange={e => setForm(p => ({ ...p, party_name: e.target.value }))} />
              <Input placeholder="ঠিকানা" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              <Input placeholder="মোবাইল" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} />
              <Input type="number" placeholder="পরিমাণ" value={form.opening_balance || ""} onChange={e => setForm(p => ({ ...p, opening_balance: Number(e.target.value) }))} />
              <Input type="number" placeholder="সুদের হার %" value={form.interest_rate || ""} onChange={e => setForm(p => ({ ...p, interest_rate: Number(e.target.value) }))} />
              <Button onClick={() => saveLoan.mutate()} className="w-full font-bengali bg-success hover:bg-success/90">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loans?.map(loan => {
          const collected = transactions?.filter(tx => tx.loan_id === loan.id).reduce((s, tx) => s + tx.amount, 0) || 0;
          const balance = (loan.opening_balance || 0) - collected;
          return (
            <div key={loan.id} onClick={() => setSelectedLoan(loan.id)} className={`bg-card border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selectedLoan === loan.id ? "ring-2 ring-primary" : ""}`}>
              <div className="flex justify-between items-start">
                <div><p className="font-bold font-bengali">{loan.party_name}</p><p className="text-xs text-muted-foreground">{loan.mobile}</p></div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-bengali">দেওয়া: ৳{(loan.opening_balance || 0).toLocaleString()}</p>
                  <p className="text-xs text-success font-bengali">আদায়: ৳{collected.toLocaleString()}</p>
                  <p className="font-bold text-destructive font-bengali">বাকি: ৳{balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedLoan && (
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold font-bengali">আদায়ের ইতিহাস</h3>
            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogTrigger asChild><Button size="sm" className="font-bengali bg-success hover:bg-success/90"><Plus className="w-3 h-3 mr-1" />আদায়</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle className="font-bengali">আদায় এন্ট্রি</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input type="number" placeholder="পরিমাণ" value={txForm.amount || ""} onChange={e => setTxForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                  <Input placeholder="নোট" value={txForm.note} onChange={e => setTxForm(p => ({ ...p, note: e.target.value }))} />
                  <Button onClick={() => saveTx.mutate()} className="w-full font-bengali bg-success hover:bg-success/90">সংরক্ষণ করুন</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="font-bengali"><th className="p-2 text-left">তারিখ</th><th className="p-2 text-right">পরিমাণ</th><th className="p-2 text-left">নোট</th></tr></thead>
            <tbody>{transactions?.map(tx => <tr key={tx.id} className="border-t"><td className="p-2">{tx.date}</td><td className="p-2 text-right font-bold text-success">৳{tx.amount.toLocaleString()}</td><td className="p-2">{tx.note}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoanLentPage;
