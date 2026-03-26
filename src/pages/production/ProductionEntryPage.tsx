import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EntryCustomFields from "@/components/EntryCustomFields";
import EntryAttachment from "@/components/EntryAttachment";

const db = supabase as any;
const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
const toBnMoney = (n: number) => n.toLocaleString("en-US");

const ProductionEntryPage = () => {
  const qc = useQueryClient();
  const [entryId, setEntryId] = useState(() => crypto.randomUUID());
  const [date, setDate] = useState<Date>(new Date());
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [colorId, setColorId] = useState("");
  const [season, setSeason] = useState("শীত");
  const [locationId, setLocationId] = useState("");
  const [fullCartons, setFullCartons] = useState(0);
  const [shortCartons, setShortCartons] = useState(0);
  const [extraCartons, setExtraCartons] = useState(0);
  const [note, setNote] = useState("");

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: async () => { const { data } = await supabase.from("brands").select("*").eq("is_active", true); return data || []; } });
  const { data: models } = useQuery({ queryKey: ["models"], queryFn: async () => { const { data } = await supabase.from("models").select("*").eq("is_active", true); return data || []; } });
  const { data: articles } = useQuery({ queryKey: ["articles"], queryFn: async () => { const { data } = await supabase.from("articles").select("*").eq("is_active", true); return data || []; } });
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: async () => { const { data } = await supabase.from("colors").select("*").eq("is_active", true); return data || []; } });
  const { data: locations } = useQuery({ queryKey: ["locations-godown"], queryFn: async () => { const { data } = await supabase.from("locations").select("*").eq("is_active", true); return data || []; } });
  const { data: activeYear } = useQuery({ queryKey: ["activeYear"], queryFn: async () => { const { data } = await supabase.from("financial_years").select("*").eq("is_active", true).single(); return data; } });

  const { data: bom = [] } = useQuery({
    queryKey: ["bom", articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const { data } = await db.from("bill_of_materials")
        .select("*, raw_materials(id, name_bn, unit)")
        .eq("article_id", articleId);
      return data || [];
    },
    enabled: !!articleId,
  });

  const filteredModels = useMemo(() => models?.filter((m) => !brandId || m.brand_id === brandId) || [], [models, brandId]);
  const filteredArticles = useMemo(() => articles?.filter((a) => !modelId || a.model_id === modelId) || [], [articles, modelId]);
  const godownLocations = useMemo(() => locations?.filter((l) => l.type === "godown" || l.type === "গোডাউন") || [], [locations]);

  const selectedArticle = articles?.find((a) => a.id === articleId);
  const pairsPerCarton = selectedArticle?.pairs_per_carton || 24;
  const totalPairs = fullCartons * pairsPerCarton;

  // ✅ Material usage calculation
  const materialUsage = useMemo(() => {
    if (!(bom as any[]).length || !totalPairs) return [];
    return (bom as any[]).map((b: any) => ({
      name: b.raw_materials?.name_bn,
      material_id: b.raw_materials?.id,
      unit: b.raw_materials?.unit || "",
      quantity_per_pair: Number(b.quantity_per_pair) || 0,
      amount_per_pair: Number(b.amount_per_pair) || 0,
      total_quantity: (Number(b.quantity_per_pair) || 0) * totalPairs,
      total_amount: (Number(b.amount_per_pair) || 0) * totalPairs,
    }));
  }, [bom, totalPairs]);

  const totalMaterialCost = materialUsage.reduce((s, m) => s + m.total_amount, 0);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!articleId) throw new Error("আর্টিকেল সিলেক্ট করুন");
      if (totalPairs === 0) throw new Error("কার্টন সংখ্যা দিন");

      const { data: prod, error } = await supabase.from("productions").insert({
        id: entryId,
        date: format(date, "yyyy-MM-dd"),
        brand_id: brandId || null,
        model_id: modelId || null,
        article_id: articleId || null,
        color_id: colorId || null,
        season,
        location_id: locationId || null,
        full_cartons: fullCartons,
        short_cartons: shortCartons,
        extra_cartons: extraCartons,
        pairs_count: totalPairs,
        year_id: activeYear?.id || null,
        note,
      }).select().single();
      if (error) throw error;

      // Finished goods stock
      const { error: e2 } = await supabase.from("stock_movements").insert({
        date: format(date, "yyyy-MM-dd"),
        article_id: articleId || null,
        color_id: colorId || null,
        season,
        to_location_id: locationId || null,
        cartons: fullCartons + shortCartons + extraCartons,
        pairs: totalPairs,
        type: "production",
        reference_id: prod.id,
      });
      if (e2) throw e2;

      // ✅ Raw material deduction (quantity + amount উভয়)
      if ((bom as any[]).length > 0) {
        for (const b of bom as any[]) {
          const totalQty = Number(b.quantity_per_pair) * totalPairs;
          const totalAmt = Number(b.amount_per_pair) * totalPairs;
          if (totalAmt > 0 || totalQty > 0) {
            await db.from("raw_material_movements").insert({
              date: format(date, "yyyy-MM-dd"),
              material_id: b.raw_materials?.id,
              amount: totalAmt > 0 ? -totalAmt : 0,
              type: "production_use",
              reference_id: prod.id,
              note: `উৎপাদনে ব্যবহার — ${totalPairs} জোড়া${totalQty > 0 ? ` (${totalQty} ${b.raw_materials?.unit})` : ""}`,
            });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("উৎপাদন সংরক্ষিত ✅");
      qc.invalidateQueries({ queryKey: ["productions"] });
      qc.invalidateQueries({ queryKey: ["raw-stock-current"] });
      setFullCartons(0); setShortCartons(0); setExtraCartons(0); setNote("");
      setEntryId(crypto.randomUUID());
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold font-bengali mb-1">নতুন উৎপাদন</h1>
      <p className="text-xs text-muted-foreground mb-4">Production Entry</p>

      <div className="space-y-3">
        <div>
          <Label className="font-bengali text-sm">তারিখ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left text-sm", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />{date ? format(date, "dd/MM/yyyy") : "তারিখ নির্বাচন"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="font-bengali text-sm">ব্র্যান্ড</Label>
            <Select value={brandId} onValueChange={(v) => { setBrandId(v); setModelId(""); setArticleId(""); }}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>{brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-bengali text-sm">মডেল</Label>
            <Select value={modelId} onValueChange={(v) => { setModelId(v); setArticleId(""); }}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>{filteredModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.name_bn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-bengali text-sm">আর্টিকেল</Label>
            <Select value={articleId} onValueChange={setArticleId}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>{filteredArticles.map((a) => <SelectItem key={a.id} value={a.id}>{a.article_no}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-bengali text-sm">রঙ</Label>
            <Select value={colorId} onValueChange={setColorId}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>{colors?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-bengali text-sm">লোকেশন</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>{godownLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name_bn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="font-bengali text-sm mb-2 block">সিজন</Label>
          <div className="flex gap-2">
            <button onClick={() => setSeason("শীত")} className={`flex-1 py-3 rounded-lg text-sm font-bengali font-bold transition-all ${season === "শীত" ? "bg-blue-600 text-white ring-2 ring-offset-1" : "bg-muted"}`}>❄️ শীত</button>
            <button onClick={() => setSeason("গরম")} className={`flex-1 py-3 rounded-lg text-sm font-bengali font-bold transition-all ${season === "গরম" ? "bg-orange-500 text-white ring-2 ring-offset-1" : "bg-muted"}`}>☀️ গরম</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="font-bengali text-xs">পূর্ণ কার্টন</Label><Input type="number" value={fullCartons || ""} onChange={(e) => setFullCartons(+e.target.value)} className="text-lg text-center" /></div>
          <div><Label className="font-bengali text-xs">শর্ট কার্টন</Label><Input type="number" value={shortCartons || ""} onChange={(e) => setShortCartons(+e.target.value)} className="text-lg text-center" /></div>
          <div><Label className="font-bengali text-xs">অতিরিক্ত কার্টন</Label><Input type="number" value={extraCartons || ""} onChange={(e) => setExtraCartons(+e.target.value)} className="text-lg text-center" /></div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs font-bengali text-muted-foreground">মোট জোড়া (পূর্ণ কার্টন × {toBn(pairsPerCarton)})</p>
          <p className="text-3xl font-bold font-bengali text-blue-700">{toBn(totalPairs)} জোড়া</p>
        </div>

        {/* ✅ Material usage breakdown */}
        {materialUsage.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-bold font-bengali text-orange-700">📦 কাঁচামাল ব্যবহার ({toBn(totalPairs)} জোড়া)</p>
            {materialUsage.map((m, i) => (
              <div key={i} className="flex justify-between text-sm font-bengali">
                <span>{m.name}</span>
                <span className="font-bold text-orange-700">
                  {m.total_quantity > 0 && `${m.total_quantity} ${m.unit}`}
                  {m.total_quantity > 0 && m.total_amount > 0 && " | "}
                  {m.total_amount > 0 && `৳${toBnMoney(m.total_amount)}`}
                </span>
              </div>
            ))}
            {totalMaterialCost > 0 && (
              <div className="border-t pt-2 flex justify-between font-bold font-bengali text-orange-700">
                <span>মোট কাঁচামাল খরচ</span>
                <span>৳{toBnMoney(totalMaterialCost)}</span>
              </div>
            )}
            {totalMaterialCost > 0 && totalPairs > 0 && (
              <p className="text-xs font-bengali text-center text-muted-foreground">
                প্রতি জোড়া = ৳{toBnMoney(totalMaterialCost / totalPairs)}
              </p>
            )}
          </div>
        )}

        {/* BOM warning */}
        {articleId && (bom as any[]).length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-bengali text-amber-700">
              এই আর্টিকেলের BOM সেট করা নেই।{" "}
              <a href="/production/bom" className="underline font-bold">BOM সেটআপ করুন →</a>
            </p>
          </div>
        )}

        <div><Label className="font-bengali text-xs">নোট</Label><Input value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" /></div>

        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-bold font-bengali">অতিরিক্ত তথ্য</p>
          <EntryCustomFields module="production" entryId={entryId} />
          <EntryAttachment module="production" entryId={entryId} />
        </div>

        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-bengali font-bold py-5"
        >
          {saveMut.isPending ? "সংরক্ষণ হচ্ছে..." : "উৎপাদন সংরক্ষণ করুন"}
        </Button>
      </div>
    </div>
  );
};

export default ProductionEntryPage;