import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

const toBn = (n: number) => n.toLocaleString("bn-BD");
const monthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const CommissionPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ party_id: "", month: now.getMonth() + 1, commission_amount: 0, paid_amount: 0 });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle(); return data; },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => { const { data } = await supabase.from("parties").select("*").eq("is_active", true).order("name"); return data || []; },
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ["commission-ledgers", activeYear?.id],
    queryFn: async () => {
      let q = supabase.from("commission_ledgers").select("*, parties(name)");
      if (activeYear?.id) q = q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("commission_ledgers").insert({
        party_id: form.party_id, month: form.month,
        commission_amount: form.commission_amount, paid_amount: form.paid_amount,
        year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "কমিশন সংরক্ষিত ✅" }); qc.invalidateQueries({ queryKey: ["commission-ledgers"] }); setOpen(false);
      setForm({ party_id: "", month: now.getMonth() + 1, commission_amount: 0, paid_amount: 0 });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // Group by party
  const partyGroups = useMemo(() => {
    const map: Record<string, { name: string; entries: typeof ledgers }> = {};
    ledgers.forEach((l) => {
      const pid = l.party_id || "unknown";
      if (!map[pid]) map[pid] = { name: (l as any).parties?.name || "—", entries: [] };
      map[pid].entries.push(l);
    });
    return Object.entries(map);
  }, [ledgers]);

  const filteredLedgers = ledgers.filter((l) => l.month === month + 1);
  const totalCommission = filteredLedgers.reduce((s, l) => s + (l.commission_amount || 0), 0);
  const totalPaid = filteredLedgers.reduce((s, l) => s + (l.paid_amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold">কমিশন</h1><p className="text-sm text-muted-foreground">Commission Ledger</p></div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />এন্ট্রি</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>কমিশন এন্ট্রি</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>পার্টি</Label>
                  <Select value={form.party_id} onValueChange={(v) => setForm((p) => ({ ...p, party_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="পার্টি নির্বাচন" /></SelectTrigger>
                    <SelectContent>{parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>মাস</Label>
                  <Select value={String(form.month)} onValueChange={(v) => setForm((p) => ({ ...p, month: +v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>কমিশন (৳)</Label><Input type="number" value={form.commission_amount || ""} onChange={(e) => setForm((p) => ({ ...p, commission_amount: +e.target.value }))} /></div>
                <div><Label>পরিশোধ (৳)</Label><Input type="number" value={form.paid_amount || ""} onChange={(e) => setForm((p) => ({ ...p, paid_amount: +e.target.value }))} /></div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.party_id || saveMutation.isPending} className="w-full">সংরক্ষণ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>পার্টি</TableHead><TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">এই মাসে</TableHead><TableHead className="text-right">পরিশোধ</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partyGroups.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">কোনো তথ্য নেই</TableCell></TableRow>}
              {partyGroups.map(([pid, group]) => {
                const prevEntries = group.entries.filter((e) => (e.month || 0) < month + 1);
                const opening = prevEntries.reduce((s, e) => s + (e.commission_amount || 0) - (e.paid_amount || 0), 0);
                const thisMonth = group.entries.filter((e) => e.month === month + 1);
                const thisCommission = thisMonth.reduce((s, e) => s + (e.commission_amount || 0), 0);
                const thisPaid = thisMonth.reduce((s, e) => s + (e.paid_amount || 0), 0);
                const closing = opening + thisCommission - thisPaid;
                return (
                  <TableRow key={pid}>
                    <TableCell className="font-bold">{group.name}</TableCell>
                    <TableCell className="text-right">৳{toBn(opening)}</TableCell>
                    <TableCell className="text-right text-primary">৳{toBn(thisCommission)}</TableCell>
                    <TableCell className="text-right text-green-600">৳{toBn(thisPaid)}</TableCell>
                    <TableCell className={`text-right font-bold ${closing > 0 ? "text-destructive" : "text-green-600"}`}>৳{toBn(closing)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট কমিশন</p><p className="text-lg font-bold text-primary">৳{toBn(totalCommission)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট পরিশোধ</p><p className="text-lg font-bold text-green-600">৳{toBn(totalPaid)}</p></CardContent></Card>
        <Card className="border-destructive"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">বাকি</p><p className="text-lg font-bold text-destructive">৳{toBn(totalCommission - totalPaid)}</p></CardContent></Card>
      </div>
    </div>
  );
};

export default CommissionPage;
