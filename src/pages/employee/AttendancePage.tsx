import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
const statusCycle = ["present", "absent", "leave"];
const statusDisplay: Record<string, { icon: string; color: string }> = {
  present: { icon: "✅", color: "bg-success/20 text-success" },
  absent: { icon: "❌", color: "bg-destructive/20 text-destructive" },
  leave: { icon: "🏖️", color: "bg-stat-blue/20 text-stat-blue" },
};

const AttendancePage = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: employees } = useQuery({ queryKey: ["employees-active"], queryFn: async () => { const { data } = await supabase.from("employees").select("*").eq("is_active", true).order("name"); return data || []; } });

  const { data: attendance } = useQuery({
    queryKey: ["attendance", month, year],
    queryFn: async () => {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;
      const { data } = await supabase.from("attendance").select("*").gte("date", startDate).lte("date", endDate);
      return data || [];
    },
  });

  useEffect(() => {
    if (attendance) {
      const map: Record<string, string> = {};
      attendance.forEach(a => { map[`${a.employee_id}-${a.date}`] = a.status || "present"; });
      setAttendanceMap(map);
    }
  }, [attendance]);

  const toggleCell = (empId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const key = `${empId}-${dateStr}`;
    const current = attendanceMap[key] || "";
    const idx = statusCycle.indexOf(current);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    setAttendanceMap(prev => ({ ...prev, [key]: next }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceMap).map(([key, status]) => {
        const [employee_id, date] = [key.substring(0, 36), key.substring(37)];
        return { employee_id, date, status };
      });
      // Upsert by deleting old and inserting new
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${daysInMonth}`;
      await supabase.from("attendance").delete().gte("date", startDate).lte("date", endDate);
      if (records.length) {
        const { error } = await supabase.from("attendance").insert(records);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast({ title: "উপস্থিতি সংরক্ষিত হয়েছে ✅" }); queryClient.invalidateQueries({ queryKey: ["attendance"] }); },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-full mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold font-bengali">উপস্থিতি</h1><p className="text-sm text-muted-foreground">Attendance</p></div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-36 font-bengali"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => saveMutation.mutate()} className="font-bengali bg-success hover:bg-success/90" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "..." : "সংরক্ষণ করুন"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-card rounded-xl border">
        <table className="text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left font-bengali sticky left-0 bg-muted z-10 min-w-[120px]">কর্মচারী</th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className="p-1 text-center min-w-[32px]">{i + 1}</th>
              ))}
              <th className="p-2 text-center font-bengali">মোট</th>
            </tr>
          </thead>
          <tbody>
            {employees?.map(emp => {
              let presentCount = 0;
              return (
                <tr key={emp.id} className="border-t">
                  <td className="p-2 font-bengali font-bold sticky left-0 bg-card z-10">{emp.name}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const key = `${emp.id}-${dateStr}`;
                    const status = attendanceMap[key] || "";
                    if (status === "present") presentCount++;
                    const display = status ? statusDisplay[status] : null;
                    return (
                      <td key={i} className="p-0 text-center">
                        <button onClick={() => toggleCell(emp.id, day)}
                          className={`w-7 h-7 rounded text-[10px] transition-all ${display ? display.color : "hover:bg-muted"}`}>
                          {display?.icon || "·"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-bold text-success">{presentCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
