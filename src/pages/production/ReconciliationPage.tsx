import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const ReconciliationPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: productions } = useQuery({
    queryKey: ["recon-prod", month, year],
    queryFn: async () => {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = `${year}-${month.padStart(2, "0")}-31`;
      const { data } = await supabase.from("productions")
        .select("article_id, season, pairs_count")
        .gte("date", startDate).lte("date", endDate);
      return data || [];
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["recon-sales", month, year],
    queryFn: async () => {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = `${year}-${month.padStart(2, "0")}-31`;
      const { data } = await supabase.from("sale_items")
        .select("article_id, season, pairs")
        .gte("sale_id", "");  // placeholder - needs join
      return data || [];
    },
  });

  const { data: damages } = useQuery({
    queryKey: ["recon-damage", month, year],
    queryFn: async () => {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endDate = `${year}-${month.padStart(2, "0")}-31`;
      const { data } = await supabase.from("damage_items")
        .select("article_id, season, pairs")
        .gte("date", startDate).lte("date", endDate);
      return data || [];
    },
  });

  const { data: articles } = useQuery({ queryKey: ["articles-all"], queryFn: async () => { const { data } = await supabase.from("articles").select("*"); return data || []; } });

  // Build reconciliation data
  const reconMap: Record<string, { article: string; season: string; opening: number; produced: number; sold: number; damaged: number }> = {};

  productions?.forEach((p) => {
    const key = `${p.article_id}-${p.season}`;
    if (!reconMap[key]) reconMap[key] = { article: articles?.find((a) => a.id === p.article_id)?.article_no || "-", season: p.season || "-", opening: 0, produced: 0, sold: 0, damaged: 0 };
    reconMap[key].produced += p.pairs_count || 0;
  });

  damages?.forEach((d) => {
    const key = `${d.article_id}-${d.season}`;
    if (!reconMap[key]) reconMap[key] = { article: articles?.find((a) => a.id === d.article_id)?.article_no || "-", season: d.season || "-", opening: 0, produced: 0, sold: 0, damaged: 0 };
    reconMap[key].damaged += d.pairs || 0;
  });

  const reconData = Object.values(reconMap).map((r) => ({
    ...r,
    closing: r.opening + r.produced - r.sold - r.damaged,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">Reconciliation</h1>
      <p className="text-xs text-muted-foreground mb-4">মাসিক পুনর্মিলন</p>

      <div className="flex gap-3 mb-4">
        <div className="w-40">
          <Label className="font-bengali text-sm">মাস</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="font-bengali text-sm">বছর</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{toBn(y)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs font-bengali text-muted-foreground mb-2">সূত্র: Closing = Opening + উৎপাদন − বিক্রি − ড্যামেজ (ক − খ + গ)</p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="font-bengali">আর্টিকেল</TableHead>
            <TableHead className="font-bengali">সিজন</TableHead>
            <TableHead className="font-bengali text-right">Opening</TableHead>
            <TableHead className="font-bengali text-right">উৎপাদন</TableHead>
            <TableHead className="font-bengali text-right">বিক্রি</TableHead>
            <TableHead className="font-bengali text-right">ড্যামেজ</TableHead>
            <TableHead className="font-bengali text-right">Closing</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {reconData.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center font-bengali py-6">কোনো ডাটা নেই</TableCell></TableRow> :
              reconData.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono">{r.article}</TableCell>
                  <TableCell className="text-xs font-bengali">{r.season}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(r.opening)}</TableCell>
                  <TableCell className="text-right text-xs text-green-600">{toBn(r.produced)}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(r.sold)}</TableCell>
                  <TableCell className="text-right text-xs text-red-600">{toBn(r.damaged)}</TableCell>
                  <TableCell className={`text-right text-xs font-bold ${r.closing < 0 ? "text-destructive" : ""}`}>{toBn(r.closing)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReconciliationPage;
