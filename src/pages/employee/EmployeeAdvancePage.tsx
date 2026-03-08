import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const EmployeeAdvancePage = () => {
  const queryClient = useQueryClient();
  const [empId, setEmpId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: 0, note: "" });

  const { data: employees } = useQuery({ queryKey: ["employees-active"], queryFn: async () => { const { data } = await supabase.from("employees").select("*").eq("is_active", true); return data || []; } });
  const { data: advances } = useQuery({
    queryKey: ["emp-advances", empId],
    queryFn: async () => { if (!empId) return []; const { data } = await supabase.from("salary_advances").select("*").eq("employee_id", empId).order("date", { ascending: false }); return data || []; },
    enabled: !!empId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salary_advances").insert({ employee_id: empId, date: format(new Date(), "yyyy-MM-dd"), ...form });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "সফলভাবে সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["emp-advances"] }); setOpen(false); setForm({ amount: 0, note: "" }); },
  });

  const totalAdvance = (advances || []).reduce((s, a) => s + a.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold font-bengali">কর্মচারী অগ্রিম</h1><p className="text-sm text-muted-foreground">Employee Advance</p></div>
        {empId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="font-bengali bg-success hover:bg-success/90"><Plus className="w-4 h-4 mr-1" />অগ্রিম দিন</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle className="font-bengali">অগ্রিম এন্ট্রি</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input type="number" placeholder="পরিমাণ" value={form.amount || ""} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                <Input placeholder="নোট" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
                <Button onClick={() => saveMutation.mutate()} className="w-full font-bengali bg-success hover:bg-success/90">সংরক্ষণ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Select value={empId} onValueChange={setEmpId}>
        <SelectTrigger className="w-full md:w-80 font-bengali"><SelectValue placeholder="কর্মচারী নির্বাচন" /></SelectTrigger>
        <SelectContent>{employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
      </Select>

      {empId && (
        <>
          <div className="gradient-stat-orange text-white rounded-xl p-4 text-center">
            <p className="text-xs opacity-70 font-bengali">মোট অগ্রিম</p>
            <p className="text-2xl font-extrabold font-bengali">৳{totalAdvance.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr className="font-bengali"><th className="p-3 text-left">তারিখ</th><th className="p-3 text-right">পরিমাণ</th><th className="p-3 text-left">নোট</th></tr></thead>
              <tbody>{advances?.map(a => <tr key={a.id} className="border-t"><td className="p-3">{a.date}</td><td className="p-3 text-right font-bold">৳{a.amount.toLocaleString()}</td><td className="p-3">{a.note}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeAdvancePage;
