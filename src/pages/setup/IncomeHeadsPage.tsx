import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const IncomeHeadsPage = () => {
  const qc = useQueryClient();
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");

  const { data: heads = [] } = useQuery({
    queryKey: ["income_heads_all"],
    queryFn: async () => {
      const { data } = await supabase.from("income_heads").select("*").order("created_at");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("income_heads").insert({ name_bn: nameBn });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income_heads_all"] });
      qc.invalidateQueries({ queryKey: ["income_heads"] });
      setNameBn(""); setNameEn("");
      toast({ title: "আয়ের খাত যোগ হয়েছে ✅" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_heads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income_heads_all"] });
      qc.invalidateQueries({ queryKey: ["income_heads"] });
      toast({ title: "মুছে ফেলা হয়েছে" });
    },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-bengali">আয়ের খাত</h1>
        <p className="text-sm text-muted-foreground">Income Heads</p>
      </div>

      <div className="bg-card border rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-bold font-bengali">নতুন খাত যোগ করুন</h2>
        <div>
          <label className="font-bengali text-sm font-medium block mb-1">নাম (বাংলা) *</label>
          <input value={nameBn} onChange={(e) => setNameBn(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-base"
            placeholder="যেমন: বিক্রয় আয়" />
        </div>
        <div>
          <label className="font-bengali text-sm font-medium block mb-1">নাম (ইংরেজি)</label>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-base"
            placeholder="e.g. Sales Income" />
        </div>
        <button onClick={() => addMutation.mutate()}
          disabled={!nameBn || addMutation.isPending}
          className="w-full bg-[hsl(var(--stat-green))] text-white px-6 py-3 rounded-xl text-base font-bengali font-bold hover:opacity-90 disabled:opacity-50">
          {addMutation.isPending ? "যোগ হচ্ছে..." : "+ যোগ করুন"}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold font-bengali">সব খাত ({heads.length})</h2>
        {heads.length === 0 && (
          <p className="text-muted-foreground font-bengali text-center py-8">এখনো কোনো খাত নেই</p>
        )}
        {heads.map((h: any) => (
          <div key={h.id} className="bg-card border rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold font-bengali">{h.name_bn}</p>
              {h.name_en && <p className="text-sm text-muted-foreground">{h.name_en}</p>}
            </div>
            <button onClick={() => deleteMutation.mutate(h.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeHeadsPage;