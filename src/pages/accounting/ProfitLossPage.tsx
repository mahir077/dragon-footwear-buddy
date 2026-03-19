import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

const db = supabase as any;

const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const ProfitLossPage = () => {
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));

  const startDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const { data: incomeAccounts = [] } = useQuery({
    queryKey: ["coa_income"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").eq("account_type", "income").eq("is_group", false).eq("is_active", true).order("code");
      return data || [];
    },
  });

  const { data: expenseAccounts = [] } = useQuery({
    queryKey: ["coa_expense"],
    queryFn: async () => {
      const { data } = await db.from("chart_of_accounts").select("*").eq("account_type", "expense").eq("is_group", false).eq("is_active", true).order("code");
      return data || [];
    },
  });

  const { data: journalLines = [], isLoading } = useQuery({
    queryKey: ["pl_journal_lines", monthFilter, yearFilter],
    queryFn: async () => {
      const { data } = await db.from("journal_lines")
        .select("*, journal_entries!inner(date)")
        .gte("journal_entries.date", startDate)
        .lte("journal_entries.date", endDate);
      return data || [];
    },
  });

  const getBalance = (accountId: string, type: "income" | "expense") => {
    const lines = journalLines.filter((l: any) => l.account_id === accountId);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);
    const totalDebit = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
    return type === "income" ? totalCredit - totalDebit : totalDebit - totalCredit;
  };

  const incomeRows = incomeAccounts.map((acc: any) => ({ ...acc, balance: getBalance(acc.id, "income") })).filter((acc: any) => acc.balance !== 0);
  const cogsCode = "5001";
  const cogsRow = expenseAccounts.find((a: any) => a.code === cogsCode);
  const cogsBalance = cogsRow ? getBalance(cogsRow.id, "expense") : 0;
  const indirectExpenseRows = expenseAccounts.filter((a: any) => a.code !== cogsCode).map((acc: any) => ({ ...acc, balance: getBalance(acc.id, "expense") })).filter((acc: any) => acc.balance !== 0);

  const totalIncome = incomeRows.reduce((sum: number, a: any) => sum + a.balance, 0);
  const grossProfit = totalIncome - cogsBalance;
  const totalIndirectExpense = indirectExpenseRows.reduce((sum: number, a: any) => sum + a.balance, 0);
  const netProfit = grossProfit - totalIndirectExpense;

  // ✅ Excel Export
  const exportToExcel = () => {
    const monthName = months[parseInt(monthFilter) - 1];
    const rows: string[][] = [];

    rows.push(["ড্রাগন ফুটওয়্যার — লাভ-ক্ষতির হিসাব"]);
    rows.push([`সময়কাল: ${monthName} ${yearFilter}`]);
    rows.push([]);

    // Income
    rows.push(["আয় (Income)", ""]);
    incomeRows.forEach((acc: any) => rows.push([acc.name_bn, String(acc.balance)]));
    rows.push(["মোট আয়", String(totalIncome)]);
    rows.push([]);

    // COGS
    rows.push(["সরাসরি ব্যয় (Direct Cost)", ""]);
    if (cogsBalance > 0) rows.push([cogsRow?.name_bn || "COGS", String(cogsBalance)]);
    rows.push(["মোট মুনাফা (Gross Profit)", String(grossProfit)]);
    rows.push([]);

    // Indirect Expense
    rows.push(["পরোক্ষ ব্যয় (Indirect Expense)", ""]);
    indirectExpenseRows.forEach((acc: any) => rows.push([acc.name_bn, String(acc.balance)]));
    rows.push(["মোট পরোক্ষ ব্যয়", String(totalIndirectExpense)]);
    rows.push([]);

    rows.push([netProfit >= 0 ? "নিট লাভ (Net Profit)" : "নিট ক্ষতি (Net Loss)", String(Math.abs(netProfit))]);

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `লাভ-ক্ষতি-${monthName}-${yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">লাভ-ক্ষতির হিসাব</h1>
          <p className="text-xs text-muted-foreground">Profit & Loss Statement</p>
        </div>
        <div className="flex gap-2">
          {/* ✅ Excel Export */}
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={isLoading || (incomeRows.length === 0 && indirectExpenseRows.length === 0)}>
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
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-base font-bengali">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বছর</span>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-base font-bengali">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center font-bengali text-muted-foreground py-8">লোড হচ্ছে...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="p-3 text-left font-bengali" colSpan={2}>📊 আয় (Income)</th>
              </tr>
            </thead>
            <tbody>
              {incomeRows.length === 0 ? (
                <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground">কোনো আয় নেই</td></tr>
              ) : incomeRows.map((acc: any) => (
                <tr key={acc.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-bengali pl-6">{acc.name_bn}</td>
                  <td className="p-3 text-right font-mono text-green-700 font-semibold">৳{acc.balance.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-bold border-t-2">
                <td className="p-3 font-bengali">মোট আয়</td>
                <td className="p-3 text-right font-mono text-green-700 text-base">৳{totalIncome.toLocaleString()}</td>
              </tr>
            </tbody>

            <thead>
              <tr className="bg-orange-500 text-white">
                <th className="p-3 text-left font-bengali" colSpan={2}>📦 সরাসরি ব্যয় (Direct Cost)</th>
              </tr>
            </thead>
            <tbody>
              {cogsBalance > 0 ? (
                <tr className="border-t hover:bg-muted/20">
                  <td className="p-3 font-bengali pl-6">{cogsRow?.name_bn || "বিক্রিত পণ্যের ব্যয় (COGS)"}</td>
                  <td className="p-3 text-right font-mono text-orange-700 font-semibold">৳{cogsBalance.toLocaleString()}</td>
                </tr>
              ) : (
                <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground">কোনো সরাসরি ব্যয় নেই</td></tr>
              )}
              <tr className={`font-bold border-t-2 ${grossProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <td className="p-3 font-bengali">মোট মুনাফা (Gross Profit)</td>
                <td className={`p-3 text-right font-mono text-base ${grossProfit >= 0 ? "text-green-700" : "text-destructive"}`}>৳{grossProfit.toLocaleString()}</td>
              </tr>
            </tbody>

            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-3 text-left font-bengali" colSpan={2}>💸 পরোক্ষ ব্যয় (Indirect Expense)</th>
              </tr>
            </thead>
            <tbody>
              {indirectExpenseRows.length === 0 ? (
                <tr><td colSpan={2} className="p-3 text-center font-bengali text-muted-foreground">কোনো পরোক্ষ ব্যয় নেই</td></tr>
              ) : indirectExpenseRows.map((acc: any) => (
                <tr key={acc.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-bengali pl-6">{acc.name_bn}</td>
                  <td className="p-3 text-right font-mono text-red-700 font-semibold">৳{acc.balance.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold border-t-2">
                <td className="p-3 font-bengali">মোট পরোক্ষ ব্যয়</td>
                <td className="p-3 text-right font-mono text-red-700 text-base">৳{totalIndirectExpense.toLocaleString()}</td>
              </tr>
            </tbody>

            <tfoot>
              <tr className={`font-bold text-white text-base ${netProfit >= 0 ? "bg-green-700" : "bg-destructive"}`}>
                <td className="p-4 font-bengali text-lg">{netProfit >= 0 ? "✅ নিট লাভ (Net Profit)" : "❌ নিট ক্ষতি (Net Loss)"}</td>
                <td className="p-4 text-right font-mono text-lg">৳{Math.abs(netProfit).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs font-bengali text-muted-foreground">সময়কাল: {months[parseInt(monthFilter) - 1]}, {yearFilter}</p>
    </div>
  );
};

export default ProfitLossPage;