import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const GodownStockPage = () => {
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const { data: stock } = useQuery({
    queryKey: ["v_shoe_stock"],
    queryFn: async () => {
      const { data } = await supabase.from("v_shoe_stock").select("*");
      return data || [];
    },
  });

  const { data: articles } = useQuery({ queryKey: ["articles-all"], queryFn: async () => { const { data } = await supabase.from("articles").select("*"); return data || []; } });
  const { data: colors } = useQuery({ queryKey: ["colors-all"], queryFn: async () => { const { data } = await supabase.from("colors").select("*"); return data || []; } });
  const { data: locations } = useQuery({ queryKey: ["locations-all"], queryFn: async () => { const { data } = await supabase.from("locations").select("*"); return data || []; } });

  const getName = (list: any[] | undefined, id: string | null, field = "name_bn") => list?.find((i) => i.id === id)?.[field] || "-";

  const filtered = stock?.filter((s) => {
    if (seasonFilter !== "all" && s.season !== seasonFilter) return false;
    if (locationFilter !== "all" && s.location_id !== locationFilter) return false;
    return true;
  }) || [];

  const totals = filtered.reduce((a, s) => ({ cartons: a.cartons + (s.current_cartons || 0), pairs: a.pairs + (s.current_pairs || 0) }), { cartons: 0, pairs: 0 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-bengali">গোডাউন স্টক সারসংক্ষেপ</h1>
          <p className="text-xs text-muted-foreground">Godown Stock Summary</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs font-bengali">
          <Printer className="w-3.5 h-3.5 mr-1" /> প্রিন্ট
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", ...(locations?.filter((l) => l.type === "godown" || l.type === "গোডাউন").map((l) => l.id) || [])].map((lid) => (
          <button key={lid} onClick={() => setLocationFilter(lid)}
            className={`px-3 py-1.5 rounded text-xs font-bengali ${locationFilter === lid ? "bg-primary text-white" : "bg-muted"}`}>
            {lid === "all" ? "সব" : getName(locations, lid)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {[{ v: "all", l: "সব" }, { v: "শীত", l: "❄️ শীত" }, { v: "গরম", l: "☀️ গরম" }].map((s) => (
          <button key={s.v} onClick={() => setSeasonFilter(s.v)}
            className={`px-3 py-1.5 rounded text-xs font-bengali ${seasonFilter === s.v ? "bg-primary text-white" : "bg-muted"}`}>
            {s.l}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bengali">আর্টিকেল</TableHead>
              <TableHead className="font-bengali">রঙ</TableHead>
              <TableHead className="font-bengali">সিজন</TableHead>
              <TableHead className="font-bengali">লোকেশন</TableHead>
              <TableHead className="font-bengali text-right">কার্টন</TableHead>
              <TableHead className="font-bengali text-right">জোড়া</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center font-bengali py-6">কোনো স্টক নেই</TableCell></TableRow>
            ) : filtered.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{articles?.find((a) => a.id === s.article_id)?.article_no || "-"}</TableCell>
                <TableCell className="text-xs font-bengali">{getName(colors, s.color_id)}</TableCell>
                <TableCell className="text-xs font-bengali">{s.season || "-"}</TableCell>
                <TableCell className="text-xs font-bengali">{getName(locations, s.location_id)}</TableCell>
                <TableCell className="text-right text-xs">{toBn(Number(s.current_cartons || 0))}</TableCell>
                <TableCell className="text-right text-xs font-bold">{toBn(Number(s.current_pairs || 0))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted font-bold">
              <TableCell colSpan={4} className="font-bengali">মোট</TableCell>
              <TableCell className="text-right">{toBn(totals.cartons)}</TableCell>
              <TableCell className="text-right">{toBn(totals.pairs)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GodownStockPage;
