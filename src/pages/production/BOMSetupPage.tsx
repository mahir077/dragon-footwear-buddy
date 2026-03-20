import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

const db = supabase as any;
const toBnMoney = (n: number) => n.toLocaleString("bn-BD");

type BOMRow = {
  material_id: string;
  quantity_per_pair: number;
  unit: string;
  amount_per_pair: number;
};

const BOMSetupPage = () => {
  const qc = useQueryClient();
  const [articleId, setArticleId] = useState("");
  const [rows, setRows] = useState<BOMRow[]>([
    { material_id: "", quantity_per_pair: 0, unit: "", amount_per_pair: 0 }
  ]);

  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("*, models(name_bn)").eq("is_active", true);
      return data || [];
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["raw_materials"],
    queryFn: async () => {
      const { data } = await supabase.from("raw_materials").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: existingBOM = [] } = useQuery({
    queryKey: ["bom", articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const { data } = await db.from("bill_of_materials")
        .select("*, raw_materials(name_bn, unit)")
        .eq("article_id", articleId);
      return data || [];
    },
    enabled: !!articleId,
  });

  useEffect(() => {
    if (!articleId) return;
    if ((existingBOM as any[]).length > 0) {
      setRows((existingBOM as any[]).map((d: any) => ({
        material_id: d.material_id,
        quantity_per_pair: Number(d.quantity_per_pair) || 0,
        unit: d.raw_materials?.unit || "",
        amount_per_pair: Number(d.amount_per_pair) || 0,
      })));
    } else {
      setRows([{ material_id: "", quantity_per_pair: 0, unit: "", amount_per_pair: 0 }]);
    }
  }, [existingBOM, articleId]);

  const updateRow = (idx: number, field: keyof BOMRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "material_id") {
        const mat = (materials as any[]).find((m: any) => m.id === value);
        if (mat) next[idx].unit = mat.unit || "";
      }
      return next;
    });
  };

  const totalAmountPerPair = rows.reduce((s, r) => s + (r.amount_per_pair || 0), 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!articleId) throw new Error("আর্টিকেল সিলেক্ট করুন");
      const validRows = rows.filter(r => r.material_id && (r.quantity_per_pair > 0 || r.amount_per_pair > 0));
      if (!validRows.length) throw new Error("কমপক্ষে একটি কাঁচামাল দিন");

      await db.from("bill_of_materials").delete().eq("article_id", articleId);
      const { error } = await db.from("bill_of_materials").insert(
        validRows.map(r => ({
          article_id: articleId,
          material_id: r.material_id,
          quantity_per_pair: r.quantity_per_pair || 0,
          amount_per_pair: r.amount_per_pair || 0,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("BOM সংরক্ষিত হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["bom", articleId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const selectedArticle = (articles as any[]).find((a: any) => a.id === articleId);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold font-bengali">🔧 BOM সেটআপ</h1>
        <p className="text-xs text-muted-foreground">১ জোড়া জুতায় কত কাঁচামাল লাগে — পরিমাণ বা টাকা যেকোনো একটা দিন</p>
      </div>

      {/* Article Select */}
      <Card>
        <CardContent className="pt-4">
          <Label className="font-bengali text-sm font-bold">কোন জুতার জন্য সেট করবেন?</Label>
          <Select value={articleId} onValueChange={v => {
            setArticleId(v);
            setRows([{ material_id: "", quantity_per_pair: 0, unit: "", amount_per_pair: 0 }]);
          }}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="আর্টিকেল নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {(articles as any[]).map((a: any) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.article_no} {a.models?.name_bn ? `— ${a.models.name_bn}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* BOM Rows */}
      {articleId && (
        <Card>
          <CardHeader>
            <CardTitle className="font-bengali text-base">
              {selectedArticle?.article_no} — ১ জোড়ায় কী কী লাগে?
            </CardTitle>
            <p className="text-xs text-muted-foreground font-bengali">
              পরিমাণ (গ্রাম/পিস) অথবা টাকা — যেটা সুবিধা সেটা দিন
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-5 gap-2 text-xs font-bengali text-muted-foreground px-1">
              <span className="col-span-2">কাঁচামাল</span>
              <span className="text-center">পরিমাণ</span>
              <span className="text-center">ইউনিট</span>
              <span className="text-center">টাকা (৳)</span>
            </div>

            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                {/* Material */}
                <div className="col-span-2">
                  <Select value={row.material_id} onValueChange={v => updateRow(i, "material_id", v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="কাঁচামাল" />
                    </SelectTrigger>
                    <SelectContent>
                      {(materials as any[]).map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name_bn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <Input
                  type="number"
                  value={row.quantity_per_pair || ""}
                  onChange={e => updateRow(i, "quantity_per_pair", +e.target.value)}
                  placeholder="০"
                  className="text-center text-sm"
                />

                {/* Unit */}
                <Input
                  value={row.unit}
                  onChange={e => updateRow(i, "unit", e.target.value)}
                  placeholder="গ্রাম"
                  className="text-center text-sm"
                />

                {/* Amount */}
                <div className="flex gap-1 items-center">
                  <Input
                    type="number"
                    value={row.amount_per_pair || ""}
                    onChange={e => updateRow(i, "amount_per_pair", +e.target.value)}
                    placeholder="০"
                    className="text-center text-sm"
                  />
                  <button
                    onClick={() => rows.length > 1 && setRows(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Total cost preview */}
            {totalAmountPerPair > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-xs font-bengali text-muted-foreground">১ জোড়ার মোট কাঁচামাল খরচ</p>
                <p className="text-xl font-bold font-bengali text-blue-700">৳{toBnMoney(totalAmountPerPair)}</p>
              </div>
            )}

            <Button variant="outline" size="sm"
              onClick={() => setRows(p => [...p, { material_id: "", quantity_per_pair: 0, unit: "", amount_per_pair: 0 }])}
              className="font-bengali w-full">
              <Plus className="w-4 h-4 mr-1" /> আরো কাঁচামাল যোগ করুন
            </Button>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bengali font-bold py-5">
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "BOM সংরক্ষণ করুন"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing BOM preview */}
      {(existingBOM as any[]).length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-xs font-bengali font-bold text-green-700 mb-2">✅ সংরক্ষিত BOM:</p>
            <div className="space-y-1">
              {(existingBOM as any[]).map((b: any) => (
                <div key={b.id} className="flex justify-between text-sm font-bengali">
                  <span>{b.raw_materials?.name_bn}</span>
                  <span className="font-bold text-green-700">
                    {b.quantity_per_pair > 0 && `${b.quantity_per_pair} ${b.raw_materials?.unit || ""}`}
                    {b.quantity_per_pair > 0 && b.amount_per_pair > 0 && " | "}
                    {b.amount_per_pair > 0 && `৳${toBnMoney(b.amount_per_pair)}`}
                    /জোড়া
                  </span>
                </div>
              ))}
              {(existingBOM as any[]).some((b: any) => b.amount_per_pair > 0) && (
                <div className="border-t pt-1 flex justify-between font-bold font-bengali text-blue-700">
                  <span>মোট খরচ/জোড়া</span>
                  <span>৳{toBnMoney((existingBOM as any[]).reduce((s, b) => s + Number(b.amount_per_pair), 0))}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BOMSetupPage;