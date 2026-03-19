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
import { journalInsuranceDeposit } from "@/lib/autoJournal";

const toBn = (n: number) => n.toLocaleString("bn-BD");
const monthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

interface InsurancePageProps {
  insuranceType: string;
  title: string;
  subtitle: string;
}

const InsurancePage = ({ insuranceType, title, subtitle }: InsurancePageProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", month: now.getMonth() + 1, deposit: 0, withdrawal: 0 });

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ["insurance-ledgers", insuranceType, activeYear?.id],
    queryFn: async () => {
      let q = supabase.from("insurance_ledgers").select("*").eq("type", insuranceType);
      if (activeYear?.id) q = q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: ledger, error } = await supabase.from("insurance_ledgers").insert({
        name: form.name, address: form.address || null, month: form.month,
        deposit: form.deposit, withdrawal: form.withdrawal,
        type: insuranceType, year_id: activeYear?.id || null,
      }).select().single();
      if (error) throw error;
      return ledger;
    },
    onSuccess: (data) => {
      // ✅ Auto journal — শুধু deposit হলে
      const dateStr = format(new Date(), "yyyy-MM-dd");
      if (data && form.deposit > 0) {
        journalInsuranceDeposit(data.id, dateStr, form.deposit, activeYear?.id);
      }
      toast({ title: "সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["insurance-ledgers"] });
      setOpen(false);
      setForm({ name: "", address: "", month: now.getMonth() + 1, deposit: 0, withdrawal: 0 });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const personGroups = useMemo(() => {
    const map: Record<string, { name: string; address: string; entries: typeof ledgers }> = {};
    ledgers.forEach((l) => {
      const key = l.name;
      if (!map[key]) map[key] = { name: l.name, address: l.address || "", entries: [] };
      map[key].entries.push(l);
    });
    return Object.entries(map);
  }, [ledgers]);

  const totalDep = ledgers.filter((l) => l.month === month + 1).reduce((s, l) => s + (l.deposit || 0), 0);
  const totalWd = ledgers.filter((l) => l.month === month + 1).reduce((s, l) => s + (l.withdrawal || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />এন্ট্রি</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{title} এন্ট্রি</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>নাম</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>ঠিকানা</Label>
                  <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
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
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} className="w-full">
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
                <TableHead>ঠিকানা</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">জমা</TableHead>
                <TableHead className="text-right">উত্তোলন</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personGroups.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">কোনো তথ্য নেই</TableCell></TableRow>
              )}
              {personGroups.map(([key, group]) => {
                const prev = group.entries.filter((e) => (e.month || 0) < month + 1);
                const opening = prev.reduce((s, e) => s + (e.opening || 0) + (e.deposit || 0) - (e.withdrawal || 0), 0);
                const thisMonth = group.entries.filter((e) => e.month === month + 1);
                const dep = thisMonth.reduce((s, e) => s + (e.deposit || 0), 0);
                const wd = thisMonth.reduce((s, e) => s + (e.withdrawal || 0), 0);
                const closing = opening + dep - wd;
                return (
                  <TableRow key={key}>
                    <TableCell className="font-bold">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">{group.address || "—"}</TableCell>
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
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট জমা</p><p className="text-lg font-bold text-green-600">৳{toBn(totalDep)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট উত্তোলন</p><p className="text-lg font-bold text-destructive">৳{toBn(totalWd)}</p></CardContent></Card>
      </div>
    </div>
  );
};

export default InsurancePage;