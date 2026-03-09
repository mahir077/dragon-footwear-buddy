import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, CheckCircle } from "lucide-react";

const monthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
const toBn = (n: number) => n.toLocaleString("bn-BD");
const pad = (n: number) => String(n).padStart(2, "0");

const SalaryPage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const printRef = useRef<HTMLDivElement>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: activeYear } = useQuery({
    queryKey: ["activeYear"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle();
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", month, year],
    queryFn: async () => {
      const s = `${year}-${pad(month + 1)}-01`;
      const e = `${year}-${pad(month + 1)}-${daysInMonth}`;
      const { data } = await supabase.from("attendance").select("*").gte("date", s).lte("date", e);
      return data || [];
    },
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["salary-advances-month", month, year],
    queryFn: async () => {
      const s = `${year}-${pad(month + 1)}-01`;
      const e = `${year}-${pad(month + 1)}-31`;
      const { data } = await supabase.from("salary_advances").select("*").gte("date", s).lte("date", e);
      return data || [];
    },
  });

  const { data: salarySheets = [] } = useQuery({
    queryKey: ["salary-sheets", month, year, activeYear?.id],
    queryFn: async () => {
      let q = supabase.from("salary_sheets").select("*").eq("month", month + 1);
      if (activeYear?.id) q = q.eq("year_id", activeYear.id);
      const { data } = await q;
      return data || [];
    },
  });

  const getOTHours = (empId: string) =>
    attendance.filter((a) => a.employee_id === empId && a.status === "present")
      .reduce((s, a) => s + (a.overtime_hours || 0), 0);

  const getAdvanceTotal = (empId: string) =>
    advances.filter((a) => a.employee_id === empId).reduce((s, a) => s + a.amount, 0);

  const finalizeMutation = useMutation({
    mutationFn: async (empId: string) => {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) throw new Error("Employee not found");
      const basic = emp.basic_salary || 0;
      const otHours = getOTHours(empId);
      const otPay = Math.round(otHours * (basic / 208));
      const advDed = getAdvanceTotal(empId);
      const netPay = basic + otPay - advDed;
      const { error } = await supabase.from("salary_sheets").insert({
        employee_id: empId,
        month: month + 1,
        basic,
        overtime_pay: otPay,
        advance_deduction: advDed,
        net_pay: netPay,
        paid_date: new Date().toISOString().split("T")[0],
        year_id: activeYear?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "বেতন চূড়ান্ত হয়েছে ✅" });
      qc.invalidateQueries({ queryKey: ["salary-sheets"] });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>বেতন শিট - ${monthsBn[month]} ${year}</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f5f5f5}td:first-child,th:first-child{text-align:left}.badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">বেতন শিট</h1>
          <p className="text-sm text-muted-foreground">Salary Sheet — {monthsBn[month]} {year}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{monthsBn.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(+v)}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
        </div>
      </div>

      <div ref={printRef}>
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead className="text-right">মূল বেতন</TableHead>
                  <TableHead className="text-right">OT ঘণ্টা</TableHead>
                  <TableHead className="text-right">OT পে</TableHead>
                  <TableHead className="text-right">অগ্রিম বাদ</TableHead>
                  <TableHead className="text-right">নেট বেতন</TableHead>
                  <TableHead className="text-center">অবস্থা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const basic = emp.basic_salary || 0;
                  const otHours = getOTHours(emp.id);
                  const otPay = Math.round(otHours * (basic / 208));
                  const advDed = getAdvanceTotal(emp.id);
                  const netPay = basic + otPay - advDed;
                  const sheet = salarySheets.find((s) => s.employee_id === emp.id);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-bold">{emp.name}</TableCell>
                      <TableCell className="text-right">৳{toBn(basic)}</TableCell>
                      <TableCell className="text-right">{toBn(otHours)}h</TableCell>
                      <TableCell className="text-right text-primary">৳{toBn(otPay)}</TableCell>
                      <TableCell className="text-right text-destructive">৳{toBn(advDed)}</TableCell>
                      <TableCell className="text-right font-bold text-lg">৳{toBn(netPay)}</TableCell>
                      <TableCell className="text-center">
                        {sheet ? (
                          <Badge variant="outline" className="text-green-700"><CheckCircle className="w-3 h-3 mr-1" />পরিশোধিত</Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => finalizeMutation.mutate(emp.id)} disabled={finalizeMutation.isPending}>
                            বেতন চূড়ান্ত করুন
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট বেসিক</p><p className="text-lg font-bold">৳{toBn(employees.reduce((s, e) => s + (e.basic_salary || 0), 0))}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট OT</p><p className="text-lg font-bold text-primary">৳{toBn(employees.reduce((s, e) => s + Math.round(getOTHours(e.id) * ((e.basic_salary || 0) / 208)), 0))}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট অগ্রিম বাদ</p><p className="text-lg font-bold text-destructive">৳{toBn(employees.reduce((s, e) => s + getAdvanceTotal(e.id), 0))}</p></CardContent></Card>
        <Card className="border-primary"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">মোট নেট</p><p className="text-lg font-bold">৳{toBn(employees.reduce((s, e) => { const b = e.basic_salary || 0; return s + b + Math.round(getOTHours(e.id) * (b / 208)) - getAdvanceTotal(e.id); }, 0))}</p></CardContent></Card>
      </div>
    </div>
  );
};

export default SalaryPage;
