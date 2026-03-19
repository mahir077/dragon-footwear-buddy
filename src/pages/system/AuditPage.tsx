import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { format } from "date-fns";

const db = supabase as any;

const moduleLabels: Record<string, { bn: string; color: string }> = {
  sales:     { bn: "বিক্রয়",      color: "bg-blue-100 text-blue-700" },
  purchase:  { bn: "ক্রয়",        color: "bg-orange-100 text-orange-700" },
  khata:     { bn: "দৈনিক খাতা", color: "bg-green-100 text-green-700" },
  salary:    { bn: "বেতন",        color: "bg-purple-100 text-purple-700" },
  loan:      { bn: "লোন",         color: "bg-red-100 text-red-700" },
  rent:      { bn: "ভাড়া",        color: "bg-yellow-100 text-yellow-700" },
  commission:{ bn: "কমিশন",      color: "bg-pink-100 text-pink-700" },
  capital:   { bn: "মূলধন",      color: "bg-indigo-100 text-indigo-700" },
  insurance: { bn: "বীমা/PF",    color: "bg-teal-100 text-teal-700" },
  asset:     { bn: "সম্পদ",      color: "bg-gray-100 text-gray-700" },
  waste:     { bn: "বর্জ্য বিক্রি", color: "bg-lime-100 text-lime-700" },
};

const AuditPage = () => {
  const now = new Date();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(
    format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(now, "yyyy-MM-dd"));
  const [moduleFilter, setModuleFilter] = useState("all");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-journal-entries", startDate, endDate],
    queryFn: async () => {
      const { data } = await db.from("journal_entries")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const filtered = entries.filter((e: any) => {
    const matchSearch = !search ||
      e.narration?.toLowerCase().includes(search.toLowerCase()) ||
      e.source_module?.toLowerCase().includes(search.toLowerCase()) ||
      e.voucher_no?.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || e.source_module === moduleFilter;
    return matchSearch && matchModule;
  });

  const uniqueModules = [...new Set(entries.map((e: any) => e.source_module).filter(Boolean))];

  // ✅ Excel Export
  const exportToExcel = () => {
    const rows: string[][] = [];
    rows.push(["ড্রাগন ফুটওয়্যার — অডিট লগ"]);
    rows.push([`সময়কাল: ${startDate} থেকে ${endDate}`]);
    rows.push([]);
    rows.push(["তারিখ", "সময়", "বিভাগ", "বিবরণ", "ভাউচার নং", "ম্যানুয়াল"]);

    filtered.forEach((e: any) => {
      const createdAt = e.created_at ? new Date(e.created_at) : null;
      rows.push([
        e.date || "",
        createdAt ? format(createdAt, "HH:mm:ss") : "",
        moduleLabels[e.source_module]?.bn || e.source_module || "ম্যানুয়াল",
        e.narration || "",
        e.voucher_no || "—",
        e.is_manual ? "হ্যাঁ" : "না",
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `অডিট-লগ-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-bengali">📝 অডিট লগ</h1>
          <p className="text-xs text-muted-foreground">সব লেনদেনের ইতিহাস ({filtered.length} টি)</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToExcel} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-1" />Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">শুরুর তারিখ</span>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">শেষ তারিখ</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">বিভাগ</span>
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm font-bengali">
            <option value="all">সব বিভাগ</option>
            {uniqueModules.map((m: any) => (
              <option key={m} value={m}>{moduleLabels[m]?.bn || m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <span className="text-xs font-bengali text-muted-foreground">অনুসন্ধান</span>
          <Input placeholder="বিবরণ বা বিভাগ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(
          filtered.reduce((acc: any, e: any) => {
            const m = e.source_module || "manual";
            acc[m] = (acc[m] || 0) + 1;
            return acc;
          }, {})
        ).map(([mod, count]) => (
          <Badge key={mod} variant="outline" className={`font-bengali ${moduleLabels[mod]?.color || "bg-slate-100 text-slate-700"}`}>
            {moduleLabels[mod]?.bn || "ম্যানুয়াল"}: {count as number}
          </Badge>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">সময়</TableHead>
              <TableHead className="font-bengali">বিভাগ</TableHead>
              <TableHead className="font-bengali">বিবরণ</TableHead>
              <TableHead className="font-bengali">ভাউচার</TableHead>
              <TableHead className="font-bengali text-center">ধরন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center font-bengali py-8 text-muted-foreground">লোড হচ্ছে...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center font-bengali py-8 text-muted-foreground">এই সময়ে কোনো লেনদেন নেই</TableCell></TableRow>
            ) : filtered.map((e: any) => {
              const createdAt = e.created_at ? new Date(e.created_at) : null;
              const mod = e.source_module || "manual";
              return (
                <TableRow key={e.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs font-mono">{e.date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {createdAt ? format(createdAt, "HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-bengali ${moduleLabels[mod]?.color || "bg-slate-100 text-slate-700"}`}>
                      {moduleLabels[mod]?.bn || "ম্যানুয়াল"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bengali text-sm max-w-xs truncate">{e.narration || "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.voucher_no || "—"}</TableCell>
                  <TableCell className="text-center">
                    {e.is_manual ? (
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">ম্যানুয়াল</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">অটো</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground font-bengali">
        * এই লগ `journal_entries` table থেকে নেওয়া। সর্বোচ্চ ৫০০ টি দেখানো হচ্ছে।
      </p>
    </div>
  );
};

export default AuditPage;