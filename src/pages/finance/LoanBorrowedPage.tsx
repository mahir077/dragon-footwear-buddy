import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const toBn = (n: number) => n.toLocaleString("bn-BD");

const loanTypes = [
  { key: "bank", bn: "🏦 ব্যাংক লোন" },
  { key: "interest", bn: "💰 সুদী লোন" },
  { key: "hawlad", bn: "🤝 হাওলাদ" },
];

const LoanBorrowedPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    party_name: "", address: "", mobile: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    opening_balance: 0, interest_rate: 0, loan_type: "bank",
  });
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [txType, setTxType] = useState("repay_principal");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txOpen, setTxOpen] = useState(false);

  const { data: loans = [] } = useQuery({
    queryKey: ["loans-borrowed"],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("*").eq("direction", "borrowed");
      return data || [];
    },
  });

  const { data: allTx = [] } = useQuery({
    queryKey: ["loan-borrowed-all-tx"],
    queryFn: async () => {
      const loanIds = loans.map((l) => l.id);
      if (!loanIds.length) return [];
      const { data } = await supabase.from("loan_transactions").select("*").in("loan_id", loanIds).order("date", { ascending: false });
      return data || [];
    },
    enabled: loans.length > 0,
  });

  const selectedTx = allTx.filter((t) => t.loan_id === selectedLoan);
  const selectedLoanData = loans.find((l) => l.id === selectedLoan);

  const getTxTotals = (loanId: string) => {
    const txs = allTx.filter((t) => t.loan_id === loanId);
    const principal = txs.filter((t) => t.type === "repay_principal").reduce((s, t) => s + t.amount, 0);
    const interest = txs.filter((t) => t.type === "interest_paid").reduce((s, t) => s + t.amount, 0);
    return { principal, interest };
  };

  const saveLoan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("loans").insert({
        party_name: form.party_name, address: form.address, mobile: form.mobile,
        start_date: form.start_date, opening_balance: form.opening_balance,
        interest_rate: form.interest_rate, loan_type: form.loan_type, direction: "borrowed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "লোন সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["loans-borrowed"] });
      setOpen(false);
      setForm({ party_name: "", address: "", mobile: "", start_date: format(new Date(), "yyyy-MM-dd"), opening_balance: 0, interest_rate: 0, loan_type: "bank" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const saveTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("loan_transactions").insert({
        loan_id: selectedLoan, date: txDate, amount: txAmount, type: txType, note: txNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "লেনদেন সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["loan-borrowed-all-tx"] });
      setTxOpen(false);
      setTxAmount(0);
      setTxNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  if (selectedLoan && selectedLoanData) {
    const { principal, interest } = getTxTotals(selectedLoan);
    const balance = (selectedLoanData.opening_balance || 0) - principal;
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLoan(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{selectedLoanData.party_name}</h1>
            <p className="text-sm text-muted-foreground">{selectedLoanData.address} • {selectedLoanData.mobile}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মূল লোন</p><p className="text-lg font-bold">৳{toBn(selectedLoanData.opening_balance || 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">কিস্তি জমা</p><p className="text-lg font-bold text-green-600">৳{toBn(principal)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">সুদ পরিশোধ</p><p className="text-lg font-bold text-amber-600">৳{toBn(interest)}</p></CardContent></Card>
          <Card className="border-destructive"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">বাকি</p><p className="text-lg font-bold text-destructive">৳{toBn(balance)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">লেনদেনের ইতিহাস</h3>
              <Dialog open={txOpen} onOpenChange={setTxOpen}>
                <DialogTrigger asChild>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => { setTxType("repay_principal"); setTxOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1" />কিস্তি জমা
                    </Button>
                    <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={() => { setTxType("interest_paid"); setTxOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1" />সুদ পরিশোধ
                    </Button>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{txType === "repay_principal" ? "কিস্তি জমা" : "সুদ পরিশোধ"}</DialogTitle></DialogHeader>
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
                <TableRow>
                  <TableHead>তারিখ</TableHead><TableHead>ধরন</TableHead><TableHead className="text-right">পরিমাণ</TableHead><TableHead>নোট</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTx.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">কোনো লেনদেন নেই</TableCell></TableRow>}
                {selectedTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.type === "repay_principal" ? <Badge variant="outline" className="text-green-700">কিস্তি</Badge> : <Badge variant="outline" className="text-amber-700">সুদ</Badge>}</TableCell>
                    <TableCell className="text-right font-semibold">৳{toBn(tx.amount)}</TableCell>
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
        <div><h1 className="text-2xl font-extrabold">লোন নেওয়া</h1><p className="text-sm text-muted-foreground">Borrowed Loans</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />নতুন লোন</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন লোন যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>পার্টি নাম</Label><Input value={form.party_name} onChange={(e) => setForm((p) => ({ ...p, party_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
                <div><Label>মোবাইল</Label><Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} /></div>
              </div>
              <div><Label>শুরুর তারিখ</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>মূল পরিমাণ (৳)</Label><Input type="number" value={form.opening_balance || ""} onChange={(e) => setForm((p) => ({ ...p, opening_balance: +e.target.value }))} /></div>
                <div><Label>সুদের হার (%)</Label><Input type="number" value={form.interest_rate || ""} onChange={(e) => setForm((p) => ({ ...p, interest_rate: +e.target.value }))} /></div>
              </div>
              <div>
                <Label>লোনের ধরন</Label>
                <div className="flex gap-2 mt-1">
                  {loanTypes.map((t) => (
                    <button key={t.key} onClick={() => setForm((p) => ({ ...p, loan_type: t.key }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${form.loan_type === t.key ? "border-primary bg-primary/10" : "border-border"}`}>
                      {t.bn}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => saveLoan.mutate()} disabled={!form.party_name || saveLoan.isPending} className="w-full">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bank">
        <TabsList className="w-full">
          {loanTypes.map((t) => <TabsTrigger key={t.key} value={t.key} className="flex-1 text-xs">{t.bn}</TabsTrigger>)}
        </TabsList>
        {loanTypes.map((t) => (
          <TabsContent key={t.key} value={t.key} className="space-y-3 mt-3">
            {loans.filter((l) => l.loan_type === t.key).length === 0 && (
              <p className="text-center text-muted-foreground py-8">কোনো লোন নেই</p>
            )}
            {loans.filter((l) => l.loan_type === t.key).map((loan) => {
              const { principal } = getTxTotals(loan.id);
              const balance = (loan.opening_balance || 0) - principal;
              return (
                <Card key={loan.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedLoan(loan.id)}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{loan.party_name}</p>
                        <p className="text-xs text-muted-foreground">{loan.address}</p>
                        {loan.interest_rate ? <p className="text-xs text-amber-600 mt-1">সুদ: {loan.interest_rate}%</p> : null}
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={loan.is_active ? "default" : "secondary"}>{loan.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                        <p className="text-xs text-muted-foreground">মূল: ৳{toBn(loan.opening_balance || 0)}</p>
                        <p className="font-bold text-destructive">বাকি: ৳{toBn(balance)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LoanBorrowedPage;
