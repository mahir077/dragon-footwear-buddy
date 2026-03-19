import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

const db = supabase as any;

const typeLabels: Record<string, string> = {
  asset: "সম্পদ",
  liability: "দায়",
  capital: "মূলধন",
  income: "আয়",
  expense: "ব্যয়",
};

const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const TrialBalancePage = () => {
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));

  const startDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const { data: accounts = [] } = useQuery({
    queryKey: ["coa_leaf"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").eq("is_group", false).eq("is_active", true).order("code");
      return data || [];
    },
  });

  const { data: journalLines = [], isLoading } = useQuery({
    queryKey: ["journal_lines_period", monthFilter, yearFilter],
    queryFn: async () => {
      const { data } = await db.from("journal_lines")
        .select("*, journal_entries!inner(date)")
        .gte("journal_entries.date", startDate)
        .lte("journal_entries.date", endDate);
      return data || [];
    },
  });

  const accountBalances = accounts.map((acc: any) => {
    const lines = journalLines.filter((l: any) => l.account_id === acc.id);
    const totalDebit = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);
    return { ...acc, totalDebit, totalCredit };
  }).filter((acc: any) => acc.totalDebit > 0 || acc.totalCredit > 0);

  const grandDebit = accountBalances.reduce((sum: number, a: any) => sum + a.totalDebit, 0);
  const grandCredit = accountBalances.reduce((sum: number, a: any) => sum + a.totalCredit, 0);
  const isBalanced = grandDebit === grandCredit && grandDebit > 0;

  const grouped: Record<string, any[]> = {};
  accountBalances.forEach((acc: any) => {
    if (!grouped[acc.account_type]) grouped[acc.account_type] = [];
    grouped[acc.account_type].push(acc);
  });

  // ✅ Excel Export (CSV format — Excel-compatible)
  const exportToExcel = () => {
    const monthName = months[parseInt(monthFilter) - 1];
    const rows: string[][] = [];

    // Header
    rows.push(["ড্রাগন ফুটওয়্যার — ট্রায়াল ব্যালেন্স"]);
    rows.push([`সময়কাল: ${monthName} ${yearFilter}`]);
    rows.push([]);
    rows.push(["কোড", "হিসাবের নাম", "ধরন", "ডেবিট (Dr)", "ক্রেডিট (Cr)"]);

    Object.entries(typeLabels).forEach(([type, label]) => {
      const rowsForType = grouped[type] || [];
      if (!rowsForType.length) return;

      rows.push([`— ${label} —`, "", "", "", ""]);
      rowsForType.forEach((acc: any) => {
        rows.push([
          acc.code,
          acc.name_bn,
          label,
          acc.totalDebit > 0 ? String(acc.totalDebit) : "",
          acc.totalCredit > 0 ? String(acc.totalCredit) : "",
        ]);
      });

      const subtotalDr = rowsForType.reduce((s: number, a: any) => s + a.totalDebit, 0);
      const subtotalCr = rowsForType.reduce((s: number, a: any) => s + a.totalCredit, 0);
      rows.push([`${label} মোট`, "", "", String(subtotalDr || ""), String(subtotalCr || "")]);
      rows.push([]);
    });

    rows.push(["সর্বমোট", "", "", String(grandDebit), String(grandCredit)]);
    rows.push([isBalanced ? "✅ ব্যালেন্স মিলেছে" : "❌ ব্যালেন্স মিলছে না"]);

    // Convert to CSV
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const BOM = "\uFEFF"; // Bengali text support
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ট্রায়াল-ব্যালেন্স-${monthName}-${yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">ট্রায়াল ব্যালেন্স</h1>
          <p className="text-xs text-muted-foreground">Trial Balance</p>
        </div>
        <div className="flex gap-2">
          {/* ✅ Excel Export Button */}
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={accountBalances.length === 0}>
            <Download className="w-4 h-4 mr-1" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />প্রিন্ট
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">মাস</span>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বছর</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
            className="border rounded-xl px-4 py-2 text-base font-bengali">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Balance status */}
      {!isLoading && accountBalances.length > 0 && (
        <div className={`px-4 py-2 rounded-lg text-sm font-bengali font-bold ${isBalanced ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
          {isBalanced ? "✅ ট্রায়াল ব্যালেন্স মিলেছে" : `❌ মিলছে না — Dr: ৳${grandDebit.toLocaleString()} | Cr: ৳${grandCredit.toLocaleString()}`}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="font-bengali">
              <th className="p-3 text-left w-16">কোড</th>
              <th className="p-3 text-left">হিসাবের নাম</th>
              <th className="p-3 text-left w-24">ধরন</th>
              <th className="p-3 text-right w-36">ডেবিট (Dr)</th>
              <th className="p-3 text-right w-36">ক্রেডিট (Cr)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">লোড হচ্ছে...</td></tr>
            ) : accountBalances.length === 0 ? (
              <tr><td colSpan={5} className="text-center font-bengali py-8 text-muted-foreground">এই মাসে কোনো জার্নাল এন্ট্রি নেই</td></tr>
            ) : (
              Object.entries(typeLabels).map(([type, label]) => {
                const rows = grouped[type] || [];
                if (rows.length === 0) return null;
                const subtotalDr = rows.reduce((sum, a) => sum + a.totalDebit, 0);
                const subtotalCr = rows.reduce((sum, a) => sum + a.totalCredit, 0);
                return (
                  <>
                    <tr key={`header-${type}`} className="bg-muted/50">
                      <td colSpan={5} className="px-3 py-1.5 font-bold font-bengali text-xs text-muted-foreground">— {label} —</td>
                    </tr>
                    {rows.map((acc: any) => (
                      <tr key={acc.id} className="border-t hover:bg-muted/20">
                        <td className="p-3 font-mono text-xs text-muted-foreground">{acc.code}</td>
                        <td className="p-3 font-bengali">{acc.name_bn}</td>
                        <td className="p-3 font-bengali text-xs text-muted-foreground">{label}</td>
                        <td className="p-3 text-right font-mono">{acc.totalDebit > 0 ? `৳${acc.totalDebit.toLocaleString()}` : "—"}</td>
                        <td className="p-3 text-right font-mono">{acc.totalCredit > 0 ? `৳${acc.totalCredit.toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                    <tr key={`subtotal-${type}`} className="bg-muted/30 font-semibold border-t">
                      <td colSpan={3} className="p-3 font-bengali text-sm">{label} মোট</td>
                      <td className="p-3 text-right font-mono text-sm">{subtotalDr > 0 ? `৳${subtotalDr.toLocaleString()}` : "—"}</td>
                      <td className="p-3 text-right font-mono text-sm">{subtotalCr > 0 ? `৳${subtotalCr.toLocaleString()}` : "—"}</td>
                    </tr>
                  </>
                );
              })
            )}
          </tbody>
          {accountBalances.length > 0 && (
            <tfoot className="bg-muted font-bold border-t-2">
              <tr>
                <td colSpan={3} className="p-3 font-bengali">সর্বমোট</td>
                <td className={`p-3 text-right font-mono text-base ${isBalanced ? "text-green-700" : "text-destructive"}`}>৳{grandDebit.toLocaleString()}</td>
                <td className={`p-3 text-right font-mono text-base ${isBalanced ? "text-green-700" : "text-destructive"}`}>৳{grandCredit.toLocaleString()}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default TrialBalancePage;