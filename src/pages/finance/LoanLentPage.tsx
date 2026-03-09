import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const toBn = (n: number) => n.toLocaleString("bn-BD");

const LoanLentPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    party_name: "", address: "", mobile: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    opening_balance: 0, interest_rate: 0, loan_type: "personal",
  });
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txOpen, setTxOpen] = useState(false);

  const { data: loans = [] } = useQuery({
    queryKey: ["loans-lent"],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*").eq("direction", "lent");
      return data || [];
    },
  });

  const { data: allTx = [] } = useQuery({
    queryKey: ["loan-lent-all-tx"],
    queryFn: async () => {
      const ids = loans.map((l) => l.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("loan_transactions").select("*").in("loan_id", ids).order("date", { ascending: false });
      return data || [];
    },
    enabled: loans.length > 0,
  });

  const selectedTx = allTx.filter((t) => t.loan_id === selectedLoan);
  const selectedLoanData = loans.find((l) => l.id === selectedLoan);

  const getCollected = (loanId: string) =>
    allTx.filter((t) => t.loan_id === loanId && t.type === "repay_principal").reduce((s, t) => s + t.amount, 0);

  const saveLoan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("loans").insert({
        party_name: form.party_name, address: form.address, mobile: form.mobile,
        start_date: form.start_date, opening_balance: form.opening_balance,
        interest_rate: form.interest_rate, loan_type: form.loan_type, direction: "lent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "লোন সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["loans-lent"] });
      setOpen(false);
      setForm({ party_name: "", address: "", mobile: "", start_date: format(new Date(), "yyyy-MM-dd"), opening_balance: 0, interest_rate: 0, loan_type: "personal" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const saveTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("loan_transactions").insert({
        loan_id: selectedLoan, date: txDate, amount: txAmount, type: "repay_principal", note: txNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "আদায় সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["loan-lent-all-tx"] });
      setTxOpen(false);
      setTxAmount(0);
      setTxNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  if (selectedLoan && selectedLoanData) {
    const collected = getCollected(selectedLoan);
    const balance = (selectedLoanData.opening_balance || 0) - collected;
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLoan(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{selectedLoanData.party_name}</h1>
            <p className="text-sm text-muted-foreground">{selectedLoanData.address} • {selectedLoanData.mobile}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">দেওয়া হয়েছে</p><p className="text-lg font-bold">৳{toBn(selectedLoanData.opening_balance || 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">আদায় হয়েছে</p><p className="text-lg font-bold text-green-600">৳{toBn(collected)}</p></CardContent></Card>
          <Card className="border-destructive"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">বাকি</p><p className="text-lg font-bold text-destructive">৳{toBn(balance)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">আদায়ের ইতিহাস</h3>
              <Dialog open={txOpen} onOpenChange={setTxOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-green-700 border-green-300"><Plus className="w-3 h-3 mr-1" />আদায়</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>আদায় এন্ট্রি</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>তারিখ</Label><Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} /></div>
                    <div><Label>পরিমাণ</Label><Input type="number" value={txAmount || ""} onChange={(e) => setTxAmount(+e.target.value)} /></div>
                    <div><Label>নোট</Label><Input value={txNote} onChange={(e) => setTxNote(e.target.value)} placeholder="ঐচ্ছিক" /></div>
                    <Button onClick={() => saveTx.mutate()} disabled={!txAmount || saveTx.isPending} className="w-full">সংরক্ষণ করুন</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>তারিখ</TableHead><TableHead>ধরন</TableHead><TableHead className="text-right">পরিমাণ</TableHead><TableHead>নোট</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {selectedTx.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">কোনো আদায় নেই</TableCell></TableRow>}
                {selectedTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell><Badge variant="outline" className="text-green-700">আদায়</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-green-600">৳{toBn(tx.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">লোন দেওয়া</h1><p className="text-sm text-muted-foreground">Lent Loans</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />নতুন</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন লোন দেওয়া</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>কার নামে</Label><Input value={form.party_name} onChange={(e) => setForm((p) => ({ ...p, party_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
                <div><Label>মোবাইল</Label><Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} /></div>
              </div>
              <div><Label>তারিখ</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>পরিমাণ (৳)</Label><Input type="number" value={form.opening_balance || ""} onChange={(e) => setForm((p) => ({ ...p, opening_balance: +e.target.value }))} /></div>
                <div><Label>সুদের হার (%)</Label><Input type="number" value={form.interest_rate || ""} onChange={(e) => setForm((p) => ({ ...p, interest_rate: +e.target.value }))} /></div>
              </div>
              <Button onClick={() => saveLoan.mutate()} disabled={!form.party_name || saveLoan.isPending} className="w-full">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loans.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো লোন নেই</p>}
        {loans.map((loan) => {
          const collected = getCollected(loan.id);
          const balance = (loan.opening_balance || 0) - collected;
          return (
            <Card key={loan.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedLoan(loan.id)}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{loan.party_name}</p>
                    <p className="text-xs text-muted-foreground">{loan.mobile}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={loan.is_active ? "default" : "secondary"}>{loan.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                    <p className="text-xs text-muted-foreground">দেওয়া: ৳{toBn(loan.opening_balance || 0)}</p>
                    <p className="text-xs text-green-600">আদায়: ৳{toBn(collected)}</p>
                    <p className="font-bold text-destructive">বাকি: ৳{toBn(balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LoanLentPage;
