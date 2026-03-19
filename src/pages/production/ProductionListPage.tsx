import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EntryAttachment from "@/components/EntryAttachment";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const ProductionListPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const now = new Date();

  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  const [dateFilter, setDateFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startDate = dateFilter
    ? dateFilter
    : `${yearFilter}-${monthFilter.padStart(2, "0")}-01`;
  const endDate = dateFilter
    ? dateFilter
    : `${yearFilter}-${monthFilter.padStart(2, "0")}-31`;

  const { data: productions } = useQuery({
    queryKey: ["productions", monthFilter, yearFilter, dateFilter],
    queryFn: async () => {
      const { data } = await supabase.from("productions")
        .select("*, brands:brand_id(name_bn), models:model_id(name_bn), articles:article_id(article_no), colors:color_id(name_bn), locations:location_id(name_bn)")
        .order("date", { ascending: false })
        .gte("date", startDate)
        .lte("date", endDate);
      return data || [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("stock_movements").delete().eq("reference_id", id);
      const { error } = await supabase.from("productions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["productions"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = (productions || []).reduce((acc, p) => ({
    fullCartons: acc.fullCartons + (p.full_cartons || 0),
    shortCartons: acc.shortCartons + (p.short_cartons || 0),
    pairs: acc.pairs + (p.pairs_count || 0),
  }), { fullCartons: 0, shortCartons: 0, pairs: 0 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">উৎপাদন তালিকা</h1>
          <p className="text-xs text-muted-foreground">Production List</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs font-bengali">
          <Printer className="w-3.5 h-3.5 mr-1" /> প্রিন্ট
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">নির্দিষ্ট তারিখ</span>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm" />
        </div>
        {dateFilter && (
          <button onClick={() => setDateFilter("")}
            className="text-xs font-bengali text-destructive border border-destructive rounded-xl px-3 py-2 hover:bg-destructive/10">
            ✕ তারিখ বাদ দাও
          </button>
        )}
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bengali ${dateFilter ? "text-muted-foreground/40" : "text-muted-foreground"}`}>মাস</span>
          <select value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setDateFilter(""); }}
            disabled={!!dateFilter} className="border rounded-xl px-4 py-2 text-base font-bengali disabled:opacity-40">
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bengali ${dateFilter ? "text-muted-foreground/40" : "text-muted-foreground"}`}>বছর</span>
          <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setDateFilter(""); }}
            disabled={!!dateFilter} className="border rounded-xl px-4 py-2 text-base font-bengali disabled:opacity-40">
            {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs font-bengali text-muted-foreground mb-3">
        {dateFilter
          ? `দেখানো হচ্ছে: ${dateFilter} তারিখের উৎপাদন`
          : `দেখানো হচ্ছে: ${months[parseInt(monthFilter) - 1]}, ${yearFilter}`}
      </p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">ব্র্যান্ড</TableHead>
              <TableHead className="font-bengali">মডেল</TableHead>
              <TableHead className="font-bengali">আর্টিকেল</TableHead>
              <TableHead className="font-bengali">রঙ</TableHead>
              <TableHead className="font-bengali">সিজন</TableHead>
              <TableHead className="font-bengali text-right">পূর্ণ কার্টন</TableHead>
              <TableHead className="font-bengali text-right">শর্ট</TableHead>
              <TableHead className="font-bengali text-right">মোট জোড়া</TableHead>
              <TableHead className="font-bengali">লোকেশন</TableHead>
              <TableHead className="text-center font-bengali">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions?.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center font-bengali py-6">কোনো উৎপাদন নেই</TableCell></TableRow>
            ) : productions?.map((p) => (
              <>
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.date}</TableCell>
                  <TableCell className="text-xs font-bengali">{(p as any).brands?.name_bn || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{(p as any).models?.name_bn || "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{(p as any).articles?.article_no || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{(p as any).colors?.name_bn || "-"}</TableCell>
                  <TableCell className="text-xs font-bengali">{p.season || "-"}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(p.full_cartons || 0)}</TableCell>
                  <TableCell className="text-right text-xs">{toBn(p.short_cartons || 0)}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{toBn(p.pairs_count || 0)}</TableCell>
                  <TableCell className="text-xs font-bengali">{(p as any).locations?.name_bn || "-"}</TableCell>
                  <TableCell className="text-center">
                    {deleteId === p.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bengali text-destructive">মুছবো?</span>
                        <button onClick={() => deleteMut.mutate(p.id)}
                          className="p-1 rounded bg-destructive text-white hover:opacity-80">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          className="p-1 rounded bg-muted hover:opacity-80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/production/entry?edit=${p.id}`)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {/* ✅ Attachment */}
                <TableRow key={`${p.id}-attach`}>
                  <TableCell colSpan={11} className="px-3 pb-2 pt-0">
                    <EntryAttachment module="production" entryId={p.id} />
                  </TableCell>
                </TableRow>
              </>
            ))}

            {/* Summary row */}
            {productions && productions.length > 0 && (
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={6} className="font-bengali text-sm">মোট ({toBn(productions.length)} টি)</TableCell>
                <TableCell className="text-right text-sm">{toBn(totals.fullCartons)}</TableCell>
                <TableCell className="text-right text-sm">{toBn(totals.shortCartons)}</TableCell>
                <TableCell className="text-right text-sm">{toBn(totals.pairs)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductionListPage;