import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import { format } from "date-fns";

const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const SalaryPage = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { data: employees } = useQuery({ queryKey: ["employees-active"], queryFn: async () => { const { data } = await supabase.from("employees").select("*").eq("is_active", true); return data || []; } });
  const { data: years } = useQuery({ queryKey: ["active-year"], queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single(); return data; } });
  const { data: salarySheets } = useQuery({
    queryKey: ["salary-sheets", month, year],
    queryFn: async () => { const { data } = await supabase.from("salary_sheets").select("*").eq("month", month + 1); return data || []; },
  });
  const { data: advances } = useQuery({
    queryKey: ["salary-advances-month", month, year],
    queryFn: async () => {
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-31`;
      const { data } = await supabase.from("salary_advances").select("*").gte("date", start).lte("date", end);
      return data || [];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (empId: string) => {
      const emp = employees?.find(e => e.id === empId);
      const advanceTotal = advances?.filter(a => a.employee_id === empId).reduce((s, a) => s + a.amount, 0) || 0;
      const netPay = (emp?.basic_salary || 0) - advanceTotal;
      const { error } = await supabase.from("salary_sheets").insert({
        employee_id: empId, month: month + 1, basic: emp?.basic_salary || 0,
        advance_deduction: advanceTotal, net_pay: netPay, paid_date: format(new Date(), "yyyy-MM-dd"),
        year_id: years?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "বেতন পরিশোধ হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["salary-sheets"] }); },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold font-bengali">বেতন শিট</h1><p className="text-sm text-muted-foreground">Salary Sheet</p></div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}><SelectTrigger className="w-36 font-bengali"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />প্রিন্ট</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr className="font-bengali">
            <th className="p-3 text-left">নাম</th><th className="p-3 text-right">মূল বেতন</th>
            <th className="p-3 text-right">অগ্রিম বাদ</th><th className="p-3 text-right">নেট বেতন</th><th className="p-3 text-center">অবস্থা</th>
          </tr></thead>
          <tbody>
            {employees?.map(emp => {
              const sheet = salarySheets?.find(s => s.employee_id === emp.id);
              const advanceTotal = advances?.filter(a => a.employee_id === emp.id).reduce((s, a) => s + a.amount, 0) || 0;
              const netPay = (emp.basic_salary || 0) - advanceTotal;
              return (
                <tr key={emp.id} className="border-t">
                  <td className="p-3 font-bengali font-bold">{emp.name}</td>
                  <td className="p-3 text-right">৳{(emp.basic_salary || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-destructive">৳{advanceTotal.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold">৳{netPay.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    {sheet ? <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-bengali">পরিশোধিত</span>
                      : <Button size="sm" variant="outline" className="text-xs font-bengali" onClick={() => markPaid.mutate(emp.id)}>পরিশোধ করুন</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryPage;
