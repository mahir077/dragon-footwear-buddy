import { TrendingUp, TrendingDown, Wallet, Banknote, Building2, Calculator, Snowflake, Sun, AlertTriangle, PackageOpen, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const toBengaliDigits = (n: number): string => {
  const digits = "০১২৩৪৫৬৭৮৯";
  return n.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
};

const statCards = [
  { bn: "আজকের আয়", en: "Today's Income", icon: TrendingUp, value: 0, gradient: "gradient-stat-green", glow: "card-glow-green", link: "/khata/daily" },
  { bn: "আজকের ব্যয়", en: "Today's Expense", icon: TrendingDown, value: 0, gradient: "gradient-stat-red", glow: "card-glow-red", link: "/khata/daily" },
  { bn: "বাস্তব ব্যালেন্স", en: "Actual Balance", icon: Wallet, value: 0, gradient: "gradient-stat-blue", glow: "card-glow-blue", link: "/khata/combined" },
  { bn: "অবশিষ্ট ব্যালেন্স", en: "Remaining Balance", icon: Calculator, value: 0, gradient: "gradient-stat-deep-purple", glow: "card-glow-deep-purple", formula: "(আয়+পাওনা) − (ব্যয়+দেনা)", link: "/khata/combined" },
  { bn: "নগদ", en: "Cash", icon: Banknote, value: 0, gradient: "gradient-stat-teal", glow: "card-glow-teal", link: "/khata/cash" },
  { bn: "ব্যাংক", en: "Bank", icon: Building2, value: 0, gradient: "gradient-stat-purple", glow: "card-glow-purple", link: "/khata/bank" },
];

const stockCards = [
  { bn: "শীত স্টক", en: "Winter Cartons", icon: Snowflake, value: 0, gradient: "gradient-stat-blue", glow: "card-glow-blue", link: "/godown/stock" },
  { bn: "গরম স্টক", en: "Summer Cartons", icon: Sun, value: 0, gradient: "gradient-stat-orange", glow: "card-glow-orange", link: "/godown/stock" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  // Due alerts - top 5 parties with balance > 0
  const { data: dueParties = [] } = useQuery({
    queryKey: ["dashboard-due"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("*").gt("current_balance", 0).order("current_balance", { ascending: false }).limit(5);
      return data || [];
    },
  });

  // Low stock alerts - cartons < 5
  const { data: lowStock = [] } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("v_shoe_stock").select("*, articles:article_id(article_no)").lt("current_cartons", 5);
      return (data || []) as any[];
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-bengali mb-0.5 text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-sm text-muted-foreground tracking-wide">Dashboard Overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.en} onClick={() => navigate(card.link)}
            className={`${card.gradient} ${card.glow} group relative text-white rounded-2xl p-4 md:p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 overflow-hidden`}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/5" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base md:text-lg font-bold font-bengali leading-tight">{card.bn}</h3>
                  <p className="text-[10px] md:text-[11px] opacity-70 tracking-wide">{card.en}</p>
                </div>
                <div className="flex items-center gap-1">
                  <card.icon className="w-6 h-6 md:w-7 md:h-7 opacity-80 shrink-0" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity -mt-3" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">৳{toBengaliDigits(card.value)}</p>
              {"formula" in card && card.formula && (
                <p className="text-[10px] opacity-60 mt-1.5 font-bengali bg-white/10 inline-block px-2 py-0.5 rounded-full">{card.formula}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
        {stockCards.map((card) => (
          <div key={card.en} onClick={() => navigate(card.link)}
            className={`${card.gradient} ${card.glow} group relative text-white rounded-2xl p-4 md:p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 overflow-hidden`}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base md:text-lg font-bold font-bengali leading-tight">{card.bn}</h3>
                  <p className="text-[10px] md:text-[11px] opacity-70 tracking-wide">{card.en}</p>
                </div>
                <div className="flex items-center gap-1">
                  <card.icon className="w-6 h-6 md:w-7 md:h-7 opacity-80 shrink-0" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity -mt-3" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">৳{toBengaliDigits(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
        {/* Due Alert */}
        <div className="bg-card border border-destructive/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <h3 className="text-lg font-bold font-bengali text-foreground">বাকি পাওনা আছে</h3>
              <p className="text-xs text-muted-foreground">{dueParties.length > 0 ? `${dueParties.length} জন পার্টি` : "এখন কোনো বাকি নেই"}</p>
            </div>
          </div>
          {dueParties.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {dueParties.map((p: any) => (
                <div key={p.party_id} className="flex justify-between text-sm px-2">
                  <span className="font-bengali text-foreground">{p.name}</span>
                  <span className="font-bold text-destructive">৳{Number(p.current_balance || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/party/all-balance")} className="text-xs text-primary hover:underline font-bengali">বিস্তারিত দেখুন →</button>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-card border border-orange-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-orange-500/10"><PackageOpen className="h-5 w-5 text-orange-500" /></div>
            <div>
              <h3 className="text-lg font-bold font-bengali text-foreground">কম স্টক সতর্কতা</h3>
              <p className="text-xs text-muted-foreground">{lowStock.length > 0 ? `${lowStock.length} আইটেম` : "স্টক স্বাভাবিক আছে"}</p>
            </div>
          </div>
          {lowStock.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {lowStock.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex justify-between text-sm px-2">
                  <span className="font-bengali text-foreground">{s.articles?.article_no || "?"}</span>
                  <span className="font-bold text-orange-500">{s.current_cartons} কার্টন</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/godown/stock")} className="text-xs text-primary hover:underline font-bengali">বিস্তারিত দেখুন →</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
