import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EntryAttachment from "@/components/EntryAttachment";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const PurchaseListPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const now = new Date();

  const [suppFilter, setSuppFilter] = useState("all");
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

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases", suppFilter, monthFilter, yearFilter, dateFilter],
    queryFn: async () => {
      let q = supabase.from("purchases")
        .select("*, parties(name)")
        .order("date", { ascending: false })
        .gte("date", startDate)
        .lte("date", endDate);
      if (suppFilter !== "all") q = q.eq("supplier_id", suppFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("parties").select("*").in("type", ["supplier", "both"]);
      return data || [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("purchase_items").delete().eq("purchase_id", id);
      const { error } = await supabase.from("purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["purchases"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = (purchases || []).reduce((a, p) => ({
    total: a.total + (p.total || 0),
    paid: a.paid + (p.paid_amount || 0),
    baki: a.baki + ((p.total || 0) - (p.paid_amount || 0)),
  }), { total: 0, paid: 0, baki: 0 });

  return (
    <div>
      <h1 className="text-xl font-bold font-bengali mb-1">ক্রয় তালিকা</h1>
      <p className="text-xs text-muted-foreground mb-4">Purchase List</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-4">

        {/* নির্দিষ্ট তারিখ */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">নির্দিষ্ট তারিখ</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-xs font-bengali text-destructive border border-destructive rounded-xl px-3 py-2 hover:bg-destructive/10"
          >
            ✕ তারিখ বাদ দাও
          </button>
        )}

        {/* মাস */}
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bengali ${dateFilter ? "text-muted-foreground/40" : "text-muted-foreground"}`}>মাস</span>
          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setDateFilter(""); }}
            disabled={!!dateFilter}
            className="border rounded-xl px-4 py-2 text-base font-bengali disabled:opacity-40"
          >
            {months.map((m, i) => (
              <option key={i} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>

        {/* বছর */}
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bengali ${dateFilter ? "text-muted-foreground/40" : "text-muted-foreground"}`}>বছর</span>
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setDateFilter(""); }}
            disabled={!!dateFilter}
            className="border rounded-xl px-4 py-2 text-base font-bengali disabled:opacity-40"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>

        {/* সরবরাহকারী */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bengali text-muted-foreground">সরবরাহকারী</span>
          <Select value={suppFilter} onValueChange={setSuppFilter}>
            <SelectTrigger className="text-sm w-44"><SelectValue placeholder="সব সরবরাহকারী" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব সরবরাহকারী</SelectItem>
              {suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter info */}
      <p className="text-xs font-bengali text-muted-foreground mb-3">
        {dateFilter
          ? `দেখানো হচ্ছে: ${dateFilter} তারিখের ক্রয়`
          : `দেখানো হচ্ছে: ${months[parseInt(monthFilter) - 1]}, ${yearFilter}`}
      </p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">তারিখ</TableHead>
              <TableHead className="font-bengali">মেমো</TableHead>
              <TableHead className="font-bengali">সরবরাহকারী</TableHead>
              <TableHead className="font-bengali text-right">মোট</TableHead>
              <TableHead className="font-bengali text-right">পরিশোধ</TableHead>
              <TableHead className="font-bengali text-right">বাকি</TableHead>
              <TableHead className="text-center font-bengali">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center font-bengali py-8">লোড হচ্ছে...</TableCell></TableRow>
            ) : purchases?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center font-bengali py-8">কোনো ক্রয় নেই</TableCell></TableRow>
            ) : purchases?.map((p) => {
              const baki = (p.total || 0) - (p.paid_amount || 0);
              return (
  <>
    <TableRow key={p.id}>
      <TableCell className="text-xs">{p.date}</TableCell>
      <TableCell className="text-xs font-mono">{p.memo_no}</TableCell>
      <TableCell className="text-xs font-bengali">{(p as any).parties?.name || "-"}</TableCell>
      <TableCell className="text-right text-xs">৳{toBn(p.total || 0)}</TableCell>
      <TableCell className="text-right text-xs">৳{toBn(p.paid_amount || 0)}</TableCell>
      <TableCell className={`text-right text-xs font-bold ${baki > 0 ? "text-destructive" : ""}`}>
        ৳{toBn(baki)}
      </TableCell>
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
            <button onClick={() => navigate(`/purchase/new?edit=${p.id}`)}
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
      <TableCell colSpan={7} className="px-3 pb-2 pt-0">
        <EntryAttachment module="purchase" entryId={p.id} />
      </TableCell>
    </TableRow>
  </>
);
            })}
            {purchases && purchases.length > 0 && (
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={3} className="font-bengali text-sm">মোট ({purchases.length} টি)</TableCell>
                <TableCell className="text-right text-sm">৳{toBn(totals.total)}</TableCell>
                <TableCell className="text-right text-sm">৳{toBn(totals.paid)}</TableCell>
                <TableCell className={`text-right text-sm ${totals.baki > 0 ? "text-destructive" : ""}`}>৳{toBn(totals.baki)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchaseListPage;