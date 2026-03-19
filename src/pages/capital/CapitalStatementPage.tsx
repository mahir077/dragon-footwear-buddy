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
import { format } from "date-fns";
import { journalCapitalDeposit, journalCapitalWithdrawal } from "@/lib/autoJournal";

const toBn = (n: number) => n.toLocaleString("bn-BD");
const monthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const CapitalStatementPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ party_id: "", month: now.getMonth() + 1, deposit: 0, withdrawal: 0 });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: statements = [] } = useQuery({
    queryKey: ["capital-statements", activeYear?.id],
    queryFn: async () => {
      let q = supabase.from("capital_statements").select("*, parties(name)");
      if (activeYear?.id) q = q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: stmt, error } = await supabase.from("capital_statements").insert({
        party_id: form.party_id,
        month: form.month,
        deposit: form.deposit,
        withdrawal: form.withdrawal,
        year_id: activeYear?.id || null,
      }).select().single();
      if (error) throw error;
      return stmt;
    },
    onSuccess: (data) => {
      // ✅ Auto journal
      const dateStr = format(new Date(), "yyyy-MM-dd");
      if (data) {
        if (form.deposit > 0) {
          journalCapitalDeposit(data.id, dateStr, form.deposit, activeYear?.id);
        }
        if (form.withdrawal > 0) {
          journalCapitalWithdrawal(data.id, dateStr, form.withdrawal, activeYear?.id);
        }
      }
      toast({ title: "সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["capital-statements"] });
      setOpen(false);
      setForm({ party_id: "", month: now.getMonth() + 1, deposit: 0, withdrawal: 0 });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const partyGroups = useMemo(() => {
    const map: Record<string, { name: string; entries: typeof statements }> = {};
    statements.forEach((s) => {
      const pid = s.party_id || "unknown";
      if (!map[pid]) map[pid] = { name: (s as any).parties?.name || "—", entries: [] };
      map[pid].entries.push(s);
    });
    return Object.entries(map);
  }, [statements]);

  const totalDeposit = statements.filter((s) => s.month === month + 1).reduce((s, e) => s + (e.deposit || 0), 0);
  const totalWithdrawal = statements.filter((s) => s.month === month + 1).reduce((s, e) => s + (e.withdrawal || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">মূলধন বিবরণী</h1>
          <p className="text-sm text-muted-foreground">Capital Statement</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />এন্ট্রি</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>মূলধন এন্ট্রি</DialogTitle></DialogHeader>
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
                <div>
                  <Label>জমা (৳)</Label>
                  <Input type="number" value={form.deposit || ""} onChange={(e) => setForm((p) => ({ ...p, deposit: +e.target.value }))} />
                </div>
                <div>
                  <Label>উত্তোলন (৳)</Label>
                  <Input type="number" value={form.withdrawal || ""} onChange={(e) => setForm((p) => ({ ...p, withdrawal: +e.target.value }))} />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.party_id || saveMutation.isPending} className="w-full">
                  সংরক্ষণ করুন
                </Button>
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
                <TableHead>নাম</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">জমা</TableHead>
                <TableHead className="text-right">উত্তোলন</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partyGroups.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">কোনো তথ্য নেই</TableCell></TableRow>
              )}
              {partyGroups.map(([pid, group]) => {
                const prev = group.entries.filter((e) => (e.month || 0) < month + 1);
                const opening = prev.reduce((s, e) => s + (e.opening || 0) + (e.deposit || 0) - (e.withdrawal || 0), 0);
                const thisMonth = group.entries.filter((e) => e.month === month + 1);
                const dep = thisMonth.reduce((s, e) => s + (e.deposit || 0), 0);
                const wd = thisMonth.reduce((s, e) => s + (e.withdrawal || 0), 0);
                const closing = opening + dep - wd;
                return (
                  <TableRow key={pid}>
                    <TableCell className="font-bold">{group.name}</TableCell>
                    <TableCell className="text-right">৳{toBn(opening)}</TableCell>
                    <TableCell className="text-right text-green-600">৳{toBn(dep)}</TableCell>
                    <TableCell className="text-right text-destructive">৳{toBn(wd)}</TableCell>
                    <TableCell className="text-right font-bold">৳{toBn(closing)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট জমা</p><p className="text-lg font-bold text-green-600">৳{toBn(totalDeposit)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট উত্তোলন</p><p className="text-lg font-bold text-destructive">৳{toBn(totalWithdrawal)}</p></CardContent></Card>
      </div>
    </div>
  );
};

export default CapitalStatementPage;