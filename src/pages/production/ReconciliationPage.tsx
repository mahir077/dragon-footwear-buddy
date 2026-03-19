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

  const startDate = `${year}-${month.padStart(2, "0")}-01`;
  const endDate = `${year}-${month.padStart(2, "0")}-31`;

  const { data: productions } = useQuery({
    queryKey: ["recon-prod", month, year],
    queryFn: async () => {
      const { data } = await supabase.from("productions")
        .select("article_id, season, pairs_count")
        .gte("date", startDate)
        .lte("date", endDate);
      return data || [];
    },
  });

  // ✅ FIXED: sale_items-এ date নেই, sales table থেকে !inner join দিয়ে date filter করা হচ্ছে
  const { data: sales } = useQuery({
    queryKey: ["recon-sales", month, year],
    queryFn: async () => {
      const { data } = await supabase.from("sale_items")
        .select("article_id, season, pairs, sales!inner(date)")
        .gte("sales.date", startDate)
        .lte("sales.date", endDate);
      return data || [];
    },
  });

  const { data: damages } = useQuery({
    queryKey: ["recon-damage", month, year],
    queryFn: async () => {
      const { data } = await supabase.from("damage_items")
        .select("article_id, season, pairs")
        .gte("date", startDate)
        .lte("date", endDate);
      return data || [];
    },
  });

  const { data: articles } = useQuery({
    queryKey: ["articles-all"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("*");
      return data || [];
    },
  });

  // Build reconciliation map
  const reconMap: Record<string, {
    article: string;
    season: string;
    opening: number;
    produced: number;
    sold: number;
    damaged: number;
  }> = {};

  const getOrCreate = (articleId: string, season: string) => {
    const key = `${articleId}-${season}`;
    if (!reconMap[key]) {
      reconMap[key] = {
        article: articles?.find((a) => a.id === articleId)?.article_no || "-",
        season: season || "-",
        opening: 0,
        produced: 0,
        sold: 0,
        damaged: 0,
      };
    }
    return key;
  };

  productions?.forEach((p) => {
    const key = getOrCreate(p.article_id, p.season);
    reconMap[key].produced += p.pairs_count || 0;
  });

  // ✅ FIXED: sales forEach block যোগ করা হয়েছে — আগে এটা missing ছিল
  sales?.forEach((s) => {
    const key = getOrCreate(s.article_id, s.season);
    reconMap[key].sold += s.pairs || 0;
  });

  damages?.forEach((d) => {
    const key = getOrCreate(d.article_id, d.season);
    reconMap[key].damaged += d.pairs || 0;
  });

  const reconData = Object.values(reconMap).map((r) => ({
    ...r,
    closing: r.opening + r.produced - r.sold - r.damaged,
  }));

  // Summary totals
  const totals = reconData.reduce(
    (acc, r) => ({
      opening: acc.opening + r.opening,
      produced: acc.produced + r.produced,
      sold: acc.sold + r.sold,
      damaged: acc.damaged + r.damaged,
      closing: acc.closing + r.closing,
    }),
    { opening: 0, produced: 0, sold: 0, damaged: 0, closing: 0 }
  );

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">Reconciliation</h1>
      <p className="text-xs text-muted-foreground mb-4">মাসিক পুনর্মিলন</p>

      <div className="flex gap-3 mb-4">
        <div className="w-40">
          <Label className="font-bengali text-sm">মাস</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="font-bengali text-sm">বছর</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>{toBn(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs font-bengali text-muted-foreground mb-2">
        সূত্র: Closing = Opening + উৎপাদন − বিক্রি − ড্যামেজ (ক − খ + গ)
      </p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">আর্টিকেল</TableHead>
              <TableHead className="font-bengali">সিজন</TableHead>
              <TableHead className="font-bengali text-right">Opening</TableHead>
              <TableHead className="font-bengali text-right">উৎপাদন</TableHead>
              <TableHead className="font-bengali text-right">বিক্রি</TableHead>
              <TableHead className="font-bengali text-right">ড্যামেজ</TableHead>
              <TableHead className="font-bengali text-right">Closing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reconData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center font-bengali py-6">
                  কোনো ডাটা নেই
                </TableCell>
              </TableRow>
            ) : (
              <>
                {reconData.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{r.article}</TableCell>
                    <TableCell className="text-xs font-bengali">{r.season}</TableCell>
                    <TableCell className="text-right text-xs">{toBn(r.opening)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600">{toBn(r.produced)}</TableCell>
                    <TableCell className="text-right text-xs">{toBn(r.sold)}</TableCell>
                    <TableCell className="text-right text-xs text-red-600">{toBn(r.damaged)}</TableCell>
                    <TableCell className={`text-right text-xs font-bold ${r.closing < 0 ? "text-destructive" : ""}`}>
                      {toBn(r.closing)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary row */}
                <TableRow className="bg-muted font-bold">
                  <TableCell className="text-xs font-bengali" colSpan={2}>মোট</TableCell>
                  <TableCell className="text-right text-xs">{toBn(totals.opening)}</TableCell>
                  <TableCell className="text-right text-xs text-green-600">{toBn(totals.produced)}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(totals.sold)}</TableCell>
                  <TableCell className="text-right text-xs text-red-600">{toBn(totals.damaged)}</TableCell>
                  <TableCell className={`text-right text-xs font-bold ${totals.closing < 0 ? "text-destructive" : ""}`}>
                    {toBn(totals.closing)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReconciliationPage;