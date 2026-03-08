import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const ProductionEntryPage = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [colorId, setColorId] = useState("");
  const [season, setSeason] = useState("winter");
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

  const filteredModels = useMemo(() => models?.filter((m) => !brandId || m.brand_id === brandId) || [], [models, brandId]);
  const filteredArticles = useMemo(() => articles?.filter((a) => !modelId || a.model_id === modelId) || [], [articles, modelId]);
  const godownLocations = useMemo(() => locations?.filter((l) => l.type === "godown" || l.type === "গোডাউন") || [], [locations]);

  const selectedArticle = articles?.find((a) => a.id === articleId);
  const pairsPerCarton = selectedArticle?.pairs_per_carton || 24;
  const totalPairs = fullCartons * pairsPerCarton;

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: prod, error } = await supabase.from("productions").insert({
        date: format(date, "yyyy-MM-dd"),
        brand_id: brandId || null,
        model_id: modelId || null,
        article_id: articleId || null,
        color_id: colorId || null,
        season: season === "winter" ? "শীত" : "গরম",
        location_id: locationId || null,
        full_cartons: fullCartons,
        short_cartons: shortCartons,
        extra_cartons: extraCartons,
        pairs_count: totalPairs,
        year_id: activeYear?.id || null,
        note,
      }).select().single();
      if (error) throw error;

      // Insert stock movement
      const { error: e2 } = await supabase.from("stock_movements").insert({
        date: format(date, "yyyy-MM-dd"),
        article_id: articleId || null,
        color_id: colorId || null,
        season: season === "winter" ? "শীত" : "গরম",
        to_location_id: locationId || null,
        cartons: fullCartons + shortCartons + extraCartons,
        pairs: totalPairs,
        type: "production",
        reference_id: prod.id,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("সফলভাবে সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["productions"] });
      setFullCartons(0); setShortCartons(0); setExtraCartons(0); setNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold font-bengali mb-1">নতুন উৎপাদন</h1>
      <p className="text-xs text-muted-foreground mb-4">Production Entry</p>

      <div className="space-y-3">
        {/* Date */}
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

        {/* Cascading dropdowns */}
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

        {/* Season */}
        <div>
          <Label className="font-bengali text-sm mb-2 block">সিজন</Label>
          <div className="flex gap-2">
            <button onClick={() => setSeason("winter")} className={`flex-1 py-3 rounded-lg text-sm font-bengali font-bold transition-all ${season === "winter" ? "bg-blue-600 text-white ring-2 ring-offset-1" : "bg-muted"}`}>
              ❄️ শীত
            </button>
            <button onClick={() => setSeason("summer")} className={`flex-1 py-3 rounded-lg text-sm font-bengali font-bold transition-all ${season === "summer" ? "bg-orange-500 text-white ring-2 ring-offset-1" : "bg-muted"}`}>
              ☀️ গরম
            </button>
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="font-bengali text-xs">পূর্ণ কার্টন</Label><Input type="number" value={fullCartons || ""} onChange={(e) => setFullCartons(+e.target.value)} className="text-lg text-center" /></div>
          <div><Label className="font-bengali text-xs">শর্ট কার্টন</Label><Input type="number" value={shortCartons || ""} onChange={(e) => setShortCartons(+e.target.value)} className="text-lg text-center" /></div>
          <div><Label className="font-bengali text-xs">অতিরিক্ত কার্টন</Label><Input type="number" value={extraCartons || ""} onChange={(e) => setExtraCartons(+e.target.value)} className="text-lg text-center" /></div>
        </div>

        {/* Calculated pairs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs font-bengali text-muted-foreground">মোট জোড়া (পূর্ণ কার্টন × {toBn(pairsPerCarton)})</p>
          <p className="text-3xl font-bold font-bengali text-blue-700">{toBn(totalPairs)} জোড়া</p>
        </div>

        <div><Label className="font-bengali text-xs">নোট</Label><Input value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" /></div>

        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-bengali font-bold py-5"
        >
          উৎপাদন সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
};

export default ProductionEntryPage;
