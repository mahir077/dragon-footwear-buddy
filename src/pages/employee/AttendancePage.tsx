import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const monthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
const statusCycle = ["", "present", "absent", "leave"];
const statusConfig: Record<string, { icon: string; bg: string }> = {
  present: { icon: "✅", bg: "bg-green-100 dark:bg-green-900/30" },
  absent:  { icon: "❌", bg: "bg-red-100 dark:bg-red-900/30" },
  leave:   { icon: "🏖️", bg: "bg-blue-100 dark:bg-blue-900/30" },
};

type CellData = { status: string; late_minutes: number; overtime_hours: number; id?: string };

const toBn = (n: number) => n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const AttendancePage = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  // map: "empId-YYYY-MM-DD" -> CellData
  const [cells, setCells] = useState<Record<string, CellData>>({});

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const cellKey = (empId: string, day: number) => `${empId}-${dateStr(day)}`;

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["attendance", month, year],
    queryFn: async () => {
      const s = `${year}-${pad(month + 1)}-01`;
      const e = `${year}-${pad(month + 1)}-${daysInMonth}`;
      const { data } = await supabase.from("attendance").select("*").gte("date", s).lte("date", e);
      return data || [];
    },
  });

  useEffect(() => {
    if (!attendance) return;
    const map: Record<string, CellData> = {};
    attendance.forEach((a) => {
      const key = `${a.employee_id}-${a.date}`;
      map[key] = {
        status: a.status || "present",
        late_minutes: a.late_minutes || 0,
        overtime_hours: a.overtime_hours || 0,
        id: a.id,
      };
    });
    setCells(map);
  }, [attendance]);

  const toggleStatus = useCallback((empId: string, day: number) => {
    const key = cellKey(empId, day);
    setCells((prev) => {
      const current = prev[key]?.status || "";
      const idx = statusCycle.indexOf(current);
      const next = statusCycle[(idx + 1) % statusCycle.length];
      if (!next) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { ...(prev[key] || { late_minutes: 0, overtime_hours: 0 }), status: next } };
    });
  }, [year, month]);

  const updateField = useCallback((empId: string, day: number, field: "late_minutes" | "overtime_hours", value: number) => {
    const key = cellKey(empId, day);
    setCells((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: { ...prev[key], [field]: value } };
    });
  }, [year, month]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const s = `${year}-${pad(month + 1)}-01`;
      const e = `${year}-${pad(month + 1)}-${daysInMonth}`;
      await supabase.from("attendance").delete().gte("date", s).lte("date", e);
      const records = Object.entries(cells).map(([key, cell]) => {
        const employee_id = key.substring(0, 36);
        const date = key.substring(37);
        return {
          employee_id, date,
          status: cell.status,
          late_minutes: cell.late_minutes || 0,
          overtime_hours: cell.overtime_hours || 0,
        };
      });
      if (records.length) {
        const { error } = await supabase.from("attendance").insert(records);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "উপস্থিতি সংরক্ষিত হয়েছে ✅" });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  // Summary per employee
  const getSummary = (empId: string) => {
    let present = 0, absent = 0, totalLate = 0, totalOT = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const c = cells[cellKey(empId, d)];
      if (!c) continue;
      if (c.status === "present") { present++; totalLate += c.late_minutes || 0; totalOT += c.overtime_hours || 0; }
      else if (c.status === "absent") absent++;
    }
    return { present, absent, totalLate, totalOT };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">উপস্থিতি</h1>
          <p className="text-sm text-muted-foreground">Attendance Grid</p>
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
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="text-xs w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left sticky left-0 bg-muted z-10 min-w-[130px]">কর্মচারী</th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className="p-1 text-center min-w-[50px]">{toBn(i + 1)}</th>
              ))}
              <th className="p-2 text-center min-w-[50px]">উপ.</th>
              <th className="p-2 text-center min-w-[50px]">অনু.</th>
              <th className="p-2 text-center min-w-[50px]">লেট</th>
              <th className="p-2 text-center min-w-[50px]">OT</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const summary = getSummary(emp.id);
              return (
                <tr key={emp.id} className="border-t">
                  <td className="p-2 font-bold sticky left-0 bg-card z-10 whitespace-nowrap">{emp.name}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const key = cellKey(emp.id, day);
                    const cell = cells[key];
                    const cfg = cell ? statusConfig[cell.status] : null;
                    return (
                      <td key={i} className="p-0 text-center align-top">
                        <button
                          onClick={() => toggleStatus(emp.id, day)}
                          className={`w-full h-8 text-[11px] transition-colors ${cfg?.bg || "hover:bg-muted"}`}
                        >
                          {cfg?.icon || "·"}
                        </button>
                        {cell?.status === "present" && (
                          <div className="flex flex-col gap-0.5 px-0.5 pb-0.5">
                            <Input
                              type="number"
                              placeholder="L"
                              className="h-5 text-[9px] px-1 text-center"
                              value={cell.late_minutes || ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateField(emp.id, day, "late_minutes", +e.target.value || 0)}
                            />
                            <Input
                              type="number"
                              placeholder="OT"
                              className="h-5 text-[9px] px-1 text-center"
                              value={cell.overtime_hours || ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateField(emp.id, day, "overtime_hours", +e.target.value || 0)}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-bold text-green-600">{toBn(summary.present)}</td>
                  <td className="p-2 text-center font-bold text-destructive">{toBn(summary.absent)}</td>
                  <td className="p-2 text-center text-amber-600">{toBn(summary.totalLate)}m</td>
                  <td className="p-2 text-center text-primary">{toBn(summary.totalOT)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>✅ উপস্থিত</span><span>❌ অনুপস্থিত</span><span>🏖️ ছুটি</span>
        <span className="ml-auto">L = লেট (মিনিট) | OT = ওভারটাইম (ঘণ্টা)</span>
      </div>
    </div>
  );
};

export default AttendancePage;
