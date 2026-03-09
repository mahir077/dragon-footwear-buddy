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

const CompanyDepositPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ party_id: "", month: now.getMonth() + 1, occupation: "", advance_taken: 0, advance_paid: 0 });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle(); return data; },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => { const { data } = await supabase.from("parties").select("*").eq("is_active", true).order("name"); return data || []; },
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ["company-deposits", activeYear?.id],
    queryFn: async () => {
      let q = supabase.from("company_deposits").select("*, parties(name)");
      if (activeYear?.id) q = q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_deposits").insert({
        party_id: form.party_id, month: form.month, occupation: form.occupation || null,
        advance_taken: form.advance_taken, advance_paid: form.advance_paid,
        year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "সংরক্ষিত ✅" }); qc.invalidateQueries({ queryKey: ["company-deposits"] }); setOpen(false);
      setForm({ party_id: "", month: now.getMonth() + 1, occupation: "", advance_taken: 0, advance_paid: 0 });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const partyGroups = useMemo(() => {
    const map: Record<string, { name: string; entries: typeof deposits }> = {};
    deposits.forEach((d) => {
      const pid = d.party_id || "unknown";
      if (!map[pid]) map[pid] = { name: (d as any).parties?.name || "—", entries: [] };
      map[pid].entries.push(d);
    });
    return Object.entries(map);
  }, [deposits]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold">কোম্পানি ডিপোজিট</h1><p className="text-sm text-muted-foreground">Company Deposits</p></div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />এন্ট্রি</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ডিপোজিট এন্ট্রি</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>পার্টি</Label>
                  <Select value={form.party_id} onValueChange={(v) => setForm((p) => ({ ...p, party_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="পার্টি নির্বাচন" /></SelectTrigger>
                    <SelectContent>{parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>পেশা</Label><Input value={form.occupation} onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))} /></div>
                <div><Label>মাস</Label>
                  <Select value={String(form.month)} onValueChange={(v) => setForm((p) => ({ ...p, month: +v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>অগ্রিম নেওয়া (৳)</Label><Input type="number" value={form.advance_taken || ""} onChange={(e) => setForm((p) => ({ ...p, advance_taken: +e.target.value }))} /></div>
                <div><Label>অগ্রিম দেওয়া (৳)</Label><Input type="number" value={form.advance_paid || ""} onChange={(e) => setForm((p) => ({ ...p, advance_paid: +e.target.value }))} /></div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.party_id || saveMutation.isPending} className="w-full">সংরক্ষণ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>নাম</TableHead><TableHead className="text-right">Opening</TableHead><TableHead className="text-right">অগ্রিম নেওয়া</TableHead><TableHead className="text-right">অগ্রিম দেওয়া</TableHead><TableHead className="text-right">Closing</TableHead></TableRow></TableHeader>
            <TableBody>
              {partyGroups.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">কোনো তথ্য নেই</TableCell></TableRow>}
              {partyGroups.map(([pid, group]) => {
                const opening = group.entries.filter((e) => (e.month || 0) < month + 1).reduce((s, e) => s + (e.opening || 0) + (e.advance_taken || 0) - (e.advance_paid || 0), 0);
                const thisMonth = group.entries.filter((e) => e.month === month + 1);
                const taken = thisMonth.reduce((s, e) => s + (e.advance_taken || 0), 0);
                const paid = thisMonth.reduce((s, e) => s + (e.advance_paid || 0), 0);
                const closing = opening + taken - paid;
                return (
                  <TableRow key={pid}>
                    <TableCell className="font-bold">{group.name}</TableCell>
                    <TableCell className="text-right">৳{toBn(opening)}</TableCell>
                    <TableCell className="text-right text-primary">৳{toBn(taken)}</TableCell>
                    <TableCell className="text-right text-green-600">৳{toBn(paid)}</TableCell>
                    <TableCell className="text-right font-bold">৳{toBn(closing)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDepositPage;
