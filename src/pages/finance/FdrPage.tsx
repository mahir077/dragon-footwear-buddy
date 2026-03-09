import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const toBn = (n: number) => n.toLocaleString("bn-BD");

const FdrPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank_id: "", account_no: "", opening_balance: 0, start_date: format(new Date(), "yyyy-MM-dd") });
  const [selectedFdr, setSelectedFdr] = useState<string | null>(null);
  const [txType, setTxType] = useState("deposit");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txOpen, setTxOpen] = useState(false);

  const { data: banks = [] } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => { const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true); return data || []; },
  });

  const { data: fdrs = [] } = useQuery({
    queryKey: ["fdrs"],
    queryFn: async () => { const { data } = await supabase.from("fixed_deposits").select("*, bank_accounts(bank_name)").eq("is_active", true); return data || []; },
  });

  const { data: allTx = [] } = useQuery({
    queryKey: ["fdr-all-tx"],
    queryFn: async () => {
      const ids = fdrs.map((f) => f.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("fdr_transactions").select("*").in("fdr_id", ids).order("date", { ascending: false });
      return data || [];
    },
    enabled: fdrs.length > 0,
  });

  const selectedTx = allTx.filter((t) => t.fdr_id === selectedFdr);
  const selectedFdrData = fdrs.find((f) => f.id === selectedFdr);

  const getBalance = (fdrId: string, opening: number) => {
    const txs = allTx.filter((t) => t.fdr_id === fdrId);
    const dep = txs.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
    const wd = txs.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0);
    return opening + dep - wd;
  };

  const saveFdr = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fixed_deposits").insert({ ...form, start_date: form.start_date });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "FDR সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["fdrs"] });
      setOpen(false);
      setForm({ bank_id: "", account_no: "", opening_balance: 0, start_date: format(new Date(), "yyyy-MM-dd") });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const saveTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fdr_transactions").insert({
        fdr_id: selectedFdr, date: txDate, amount: txAmount, type: txType, note: txNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "লেনদেন সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["fdr-all-tx"] });
      setTxOpen(false);
      setTxAmount(0);
      setTxNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  if (selectedFdr && selectedFdrData) {
    const balance = getBalance(selectedFdr, selectedFdrData.opening_balance || 0);
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedFdr(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{(selectedFdrData as any).bank_accounts?.bank_name}</h1>
            <p className="text-sm text-muted-foreground">A/C: {selectedFdrData.account_no}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Opening</p><p className="text-lg font-bold">৳{toBn(selectedFdrData.opening_balance || 0)}</p></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">বর্তমান ব্যালেন্স</p><p className="text-lg font-bold text-primary">৳{toBn(balance)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">লেনদেন</h3>
              <Dialog open={txOpen} onOpenChange={setTxOpen}>
                <DialogTrigger asChild>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => { setTxType("deposit"); setTxOpen(true); }}><Plus className="w-3 h-3 mr-1" />জমা</Button>
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => { setTxType("withdrawal"); setTxOpen(true); }}><Plus className="w-3 h-3 mr-1" />উত্তোলন</Button>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{txType === "deposit" ? "জমা" : "উত্তোলন"}</DialogTitle></DialogHeader>
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
                {selectedTx.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">কোনো লেনদেন নেই</TableCell></TableRow>}
                {selectedTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.type === "deposit" ? <Badge variant="outline" className="text-green-700">জমা</Badge> : <Badge variant="outline" className="text-red-700">উত্তোলন</Badge>}</TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === "deposit" ? "text-green-600" : "text-destructive"}`}>৳{toBn(tx.amount)}</TableCell>
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
        <div><h1 className="text-2xl font-extrabold">FDR / সঞ্চয়</h1><p className="text-sm text-muted-foreground">Fixed Deposits</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />নতুন FDR</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন FDR</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>ব্যাংক</Label>
                <Select value={form.bank_id} onValueChange={(v) => setForm((p) => ({ ...p, bank_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="ব্যাংক নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>{banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>হিসাব নং</Label><Input value={form.account_no} onChange={(e) => setForm((p) => ({ ...p, account_no: e.target.value }))} /></div>
              <div><Label>শুরুর তারিখ</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Opening Balance (৳)</Label><Input type="number" value={form.opening_balance || ""} onChange={(e) => setForm((p) => ({ ...p, opening_balance: +e.target.value }))} /></div>
              <Button onClick={() => saveFdr.mutate()} disabled={!form.bank_id || saveFdr.isPending} className="w-full">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {fdrs.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো FDR নেই</p>}
        {fdrs.map((fdr) => {
          const balance = getBalance(fdr.id, fdr.opening_balance || 0);
          return (
            <Card key={fdr.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedFdr(fdr.id)}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{(fdr as any).bank_accounts?.bank_name}</p>
                    <p className="text-xs text-muted-foreground">A/C: {fdr.account_no}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">Opening: ৳{toBn(fdr.opening_balance || 0)}</p>
                    <p className="font-bold text-primary text-lg">৳{toBn(balance)}</p>
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

export default FdrPage;
