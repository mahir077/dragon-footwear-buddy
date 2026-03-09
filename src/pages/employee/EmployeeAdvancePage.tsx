import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const toBn = (n: number) => n.toLocaleString("bn-BD");

const EmployeeAdvancePage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["emp-advances", empId],
    queryFn: async () => {
      if (!empId) return [];
      const { data } = await supabase.from("salary_advances").select("*").eq("employee_id", empId).order("date", { ascending: false });
      return data || [];
    },
    enabled: !!empId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salary_advances").insert({
        employee_id: empId,
        date,
        amount: typeof amount === "number" ? amount : 0,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "অগ্রিম সংরক্ষিত ✅" });
      qc.invalidateQueries({ queryKey: ["emp-advances"] });
      setAmount("");
      setNote("");
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_advances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "মুছে ফেলা হয়েছে" });
      qc.invalidateQueries({ queryKey: ["emp-advances"] });
    },
  });

  const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
  const empName = employees.find((e) => e.id === empId)?.name || "";

  // Running total (oldest first for running sum)
  const advancesSorted = [...advances].reverse();
  let runningTotal = 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold">কর্মচারী অগ্রিম</h1>
      <p className="text-sm text-muted-foreground">Employee Advance</p>

      {/* Employee Selector */}
      <Select value={empId} onValueChange={setEmpId}>
        <SelectTrigger className="w-full md:w-80"><SelectValue placeholder="কর্মচারী নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
      </Select>

      {empId && (
        <>
          {/* Entry Form */}
          <Card>
            <CardHeader><CardTitle>নতুন অগ্রিম — {empName}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>তারিখ</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><Label>পরিমাণ (৳)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value ? +e.target.value : "")} placeholder="০" /></div>
                <div><Label>নোট</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক" /></div>
                <div className="flex items-end">
                  <Button onClick={() => saveMutation.mutate()} disabled={!amount || saveMutation.isPending} className="w-full">
                    সংরক্ষণ করুন
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Card */}
          <Card className="border-primary">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">মোট অগ্রিম</p>
              <p className="text-2xl font-extrabold text-primary">৳{toBn(totalAdvance)}</p>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead className="text-right">পরিমাণ</TableHead>
                    <TableHead>নোট</TableHead>
                    <TableHead className="text-right">মোট অগ্রিম</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advancesSorted.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">কোনো অগ্রিম নেই</TableCell></TableRow>
                  )}
                  {advancesSorted.map((a) => {
                    runningTotal += a.amount;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell className="text-right font-semibold">৳{toBn(a.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{a.note || "—"}</TableCell>
                        <TableCell className="text-right font-bold text-primary">৳{toBn(runningTotal)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EmployeeAdvancePage;
