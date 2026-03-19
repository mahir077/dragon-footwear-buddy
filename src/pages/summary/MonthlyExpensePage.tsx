import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

const db = supabase as any;

const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
const monthNums = ["01","02","03","04","05","06","07","08","09","10","11","12"];

const moduleLabels: Record<string, string> = {
  purchase:   "ক্রয় বাবদ ব্যয়",
  salary:     "বেতন ও মজুরি",
  rent:       "ভাড়া ব্যয়",
  commission: "কমিশন ব্যয়",
  insurance:  "বীমা / PF",
  asset:      "সম্পদ / অবচয়",
  loan:       "লোন সংক্রান্ত",
  khata:      "অন্যান্য ব্যয়",
  waste:      "বর্জ্য সংক্রান্ত",
  capital:    "মূলধন উত্তোলন",
};

const MonthlyExpensePage = () => {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));

  // ✅ journal_id দিয়ে join — সঠিক column name
  const { data: lines = [], isLoading } = useQuery({
    queryKey: ["monthly-expense", year],
    queryFn: async () => {
      const { data } = await db.from("journal_lines")
        .select("debit, credit, journal_entries!journal_id(date, source_module)")
        .gte("journal_entries.date", `${year}-01-01`)
        .lte("journal_entries.date", `${year}-12-31`);
      return data || [];
    },
  });

  // Build expense data: module → month → amount
  const expenseByModule: Record<string, Record<string, number>> = {};
  const monthlyTotals: Record<string, number> = {};

  lines.forEach((l: any) => {
    const entry = l.journal_entries;
    if (!entry) return;
    const date = entry.date || "";
    const module = entry.source_module || "khata";
    const monthIdx = date.substring(5, 7);
    const amount = Number(l.debit) - Number(l.credit);
    if (amount <= 0) return;

    if (!expenseByModule[module]) expenseByModule[module] = {};
    expenseByModule[module][monthIdx] = (expenseByModule[module][monthIdx] || 0) + amount;
    monthlyTotals[monthIdx] = (monthlyTotals[monthIdx] || 0) + amount;
  });

  const grandTotal = Object.values(monthlyTotals).reduce((s, v) => s + v, 0);
  const activeModules = Object.keys(expenseByModule).filter(m => Object.values(expenseByModule[m]).some(v => v > 0));

  // ✅ Excel Export
  const exportToExcel = () => {
    const rows: string[][] = [];
    rows.push([`ড্রাগন ফুটওয়্যার — মাসিক ব্যয়ের হিসাব ${year}`]);
    rows.push([]);
    rows.push(["ব্যয়ের বিভাগ", ...months, "মোট"]);

    activeModules.forEach(module => {
      const row = [moduleLabels[module] || module];
      let rowTotal = 0;
      monthNums.forEach(m => {
        const val = expenseByModule[module][m] || 0;
        rowTotal += val;
        row.push(val > 0 ? String(Math.round(val)) : "");
      });
      row.push(String(Math.round(rowTotal)));
      rows.push(row);
    });

    const totalRow = ["মোট ব্যয়"];
    monthNums.forEach(m => totalRow.push(String(Math.round(monthlyTotals[m] || 0))));
    totalRow.push(String(Math.round(grandTotal)));
    rows.push(totalRow);

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `মাসিক-ব্যয়-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">মাসিক ব্যয়ের হিসাব</h1>
          <p className="text-xs text-muted-foreground">Monthly Expense Statement — {year}</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={year} onChange={e => setYear(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm font-bengali">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={activeModules.length === 0}>
            <Download className="w-4 h-4 mr-1" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />প্রিন্ট
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center font-bengali text-muted-foreground py-8">লোড হচ্ছে...</p>
      ) : activeModules.length === 0 ? (
        <p className="text-center font-bengali text-muted-foreground py-8">এই বছরে কোনো ব্যয় নেই</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr className="font-bengali">
                <th className="p-3 text-left min-w-40">ব্যয়ের বিভাগ</th>
                {months.map((m, i) => (
                  <th key={i} className="p-2 text-right min-w-20">{m.substring(0, 3)}</th>
                ))}
                <th className="p-3 text-right min-w-24 bg-muted/80">মোট</th>
              </tr>
            </thead>
            <tbody>
              {activeModules.map(module => {
                const rowTotal = monthNums.reduce((s, m) => s + (expenseByModule[module][m] || 0), 0);
                return (
                  <tr key={module} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-bengali font-medium">{moduleLabels[module] || module}</td>
                    {monthNums.map(m => (
                      <td key={m} className="p-2 text-right font-mono">
                        {expenseByModule[module][m] > 0
                          ? `৳${Math.round(expenseByModule[module][m]).toLocaleString()}`
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                    <td className="p-3 text-right font-bold font-mono bg-muted/30">
                      ৳{Math.round(rowTotal).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-red-50 border-t-2 font-bold">
              <tr>
                <td className="p-3 font-bengali text-red-700">মোট ব্যয়</td>
                {monthNums.map(m => (
                  <td key={m} className="p-2 text-right font-mono text-red-700">
                    {monthlyTotals[m] > 0
                      ? `৳${Math.round(monthlyTotals[m]).toLocaleString()}`
                      : <span className="text-muted-foreground font-normal">—</span>}
                  </td>
                ))}
                <td className="p-3 text-right font-mono text-red-700 text-sm bg-red-100">
                  ৳{Math.round(grandTotal).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs font-bengali text-muted-foreground">
        * Journal entries থেকে expense data নেওয়া হয়েছে।
      </p>
    </div>
  );
};

export default MonthlyExpensePage;