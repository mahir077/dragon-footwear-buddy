import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { journalRentPayment } from "@/lib/autoJournal";

const toBn = (n: number) => n.toLocaleString("bn-BD");

interface RentPageProps {
  rentType: "factory" | "godown";
  title: string;
  subtitle: string;
}

const RentPage = ({ rentType, title, subtitle }: RentPageProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ party_id: "", monthly_amount: 0, opening_balance: 0, start_date: format(new Date(), "yyyy-MM-dd") });
  const [txForm, setTxForm] = useState({ type: "due", amount: 0, date: format(new Date(), "yyyy-MM-dd"), note: "" });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => { const { data } = await supabase.from("parties").select("*").eq("is_active", true).order("name"); return data || []; },
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ["rent-ledgers", rentType],
    queryFn: async () => {
      const { data } = await supabase.from("rent_ledgers").select("*, parties(name)").eq("rent_type", rentType);
      return data || [];
    },
  });

  const { data: allTx = [] } = useQuery({
    queryKey: ["rent-tx", rentType],
    queryFn: async () => {
      const ids = ledgers.map((l) => l.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("rent_transactions").select("*").in("rent_ledger_id", ids).order("date");
      return data || [];
    },
    enabled: ledgers.length > 0,
  });

  const selectedLedger = ledgers.find((l) => l.id === selectedId);
  const selectedTx = allTx.filter((t) => t.rent_ledger_id === selectedId);

  const saveLedger = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rent_ledgers").insert({
        party_id: form.party_id, monthly_amount: form.monthly_amount,
        opening_balance: form.opening_balance, start_date: form.start_date, rent_type: rentType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "সংরক্ষিত ✅" }); qc.invalidateQueries({ queryKey: ["rent-ledgers"] }); setAddOpen(false);
      setForm({ party_id: "", monthly_amount: 0, opening_balance: 0, start_date: format(new Date(), "yyyy-MM-dd") });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const saveTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rent_transactions").insert({
        rent_ledger_id: selectedId, type: txForm.type, amount: txForm.amount,
        date: txForm.date, note: txForm.note || null, year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    // পরে
onSuccess: () => {
  // ✅ Auto journal — শুধু payment হলে
  if (txForm.type === "paid" && txForm.amount > 0 && selectedId) {
    journalRentPayment(selectedId, txForm.date, txForm.amount, activeYear?.id);
  }
  toast({ title: "লেনদেন সংরক্ষিত ✅" }); qc.invalidateQueries({ queryKey: ["rent-tx"] }); setTxOpen(false);
  setTxForm({ type: "due", amount: 0, date: format(new Date(), "yyyy-MM-dd"), note: "" });
},
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // Detail view
  if (selectedId && selectedLedger) {
    let running = selectedLedger.opening_balance || 0;
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{(selectedLedger as any).parties?.name}</h1>
            <p className="text-sm text-muted-foreground">মাসিক ভাড়া: ৳{toBn(selectedLedger.monthly_amount || 0)} | Opening: ৳{toBn(selectedLedger.opening_balance || 0)}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">লেনদেন</h3>
              <Dialog open={txOpen} onOpenChange={setTxOpen}>
                <DialogTrigger asChild>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => { setTxForm((p) => ({ ...p, type: "due" })); setTxOpen(true); }}><Plus className="w-3 h-3 mr-1" />দেনা</Button>
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => { setTxForm((p) => ({ ...p, type: "paid" })); setTxOpen(true); }}><Plus className="w-3 h-3 mr-1" />পরিশোধ</Button>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{txForm.type === "due" ? "দেনা যোগ" : "পরিশোধ যোগ"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>তারিখ</Label><Input type="date" value={txForm.date} onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))} /></div>
                    <div><Label>পরিমাণ (৳)</Label><Input type="number" value={txForm.amount || ""} onChange={(e) => setTxForm((p) => ({ ...p, amount: +e.target.value }))} /></div>
                    <div><Label>নোট</Label><Input value={txForm.note} onChange={(e) => setTxForm((p) => ({ ...p, note: e.target.value }))} /></div>
                    <Button onClick={() => saveTx.mutate()} disabled={!txForm.amount || saveTx.isPending} className="w-full">সংরক্ষণ করুন</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>তারিখ</TableHead><TableHead>মাস</TableHead><TableHead className="text-right">দেনা</TableHead><TableHead className="text-right">পরিশোধ</TableHead><TableHead className="text-right">ব্যালেন্স</TableHead><TableHead>নোট</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/50"><TableCell colSpan={4} className="font-semibold">Opening Balance</TableCell><TableCell className="text-right font-bold">৳{toBn(running)}</TableCell><TableCell /></TableRow>
                {selectedTx.map((tx) => {
                  const due = tx.type === "due" ? tx.amount : 0;
                  const paid = tx.type === "paid" ? tx.amount : 0;
                  running = running + due - paid;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.date?.substring(0, 7)}</TableCell>
                      <TableCell className="text-right text-destructive">{due ? `৳${toBn(due)}` : "—"}</TableCell>
                      <TableCell className="text-right text-green-600">{paid ? `৳${toBn(paid)}` : "—"}</TableCell>
                      <TableCell className="text-right font-bold">৳{toBn(running)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.note || "—"}</TableCell>
                    </TableRow>
                  );
                })}
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
        <div><h1 className="text-2xl font-extrabold">{title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />নতুন পার্টি</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ভাড়া পার্টি</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>পার্টি</Label>
                <Select value={form.party_id} onValueChange={(v) => setForm((p) => ({ ...p, party_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="পার্টি নির্বাচন" /></SelectTrigger>
                  <SelectContent>{parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>মাসিক ভাড়া (৳)</Label><Input type="number" value={form.monthly_amount || ""} onChange={(e) => setForm((p) => ({ ...p, monthly_amount: +e.target.value }))} /></div>
              <div><Label>Opening Balance (৳)</Label><Input type="number" value={form.opening_balance || ""} onChange={(e) => setForm((p) => ({ ...p, opening_balance: +e.target.value }))} /></div>
              <div><Label>শুরুর তারিখ</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
              <Button onClick={() => saveLedger.mutate()} disabled={!form.party_id || saveLedger.isPending} className="w-full">সংরক্ষণ করুন</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {ledgers.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">কোনো ভাড়া পার্টি নেই</p>}
        {ledgers.map((l) => {
          const txs = allTx.filter((t) => t.rent_ledger_id === l.id);
          const totalDue = txs.filter((t) => t.type === "due").reduce((s, t) => s + t.amount, 0);
          const totalPaid = txs.filter((t) => t.type === "paid").reduce((s, t) => s + t.amount, 0);
          const balance = (l.opening_balance || 0) + totalDue - totalPaid;
          return (
            <Card key={l.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedId(l.id)}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{(l as any).parties?.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">মাসিক: ৳{toBn(l.monthly_amount || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Opening: ৳{toBn(l.opening_balance || 0)}</p>
                    <p className={`font-bold text-lg ${balance > 0 ? "text-destructive" : "text-green-600"}`}>৳{toBn(balance)}</p>
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

export default RentPage;
