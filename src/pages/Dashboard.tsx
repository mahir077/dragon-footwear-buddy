import { TrendingUp, TrendingDown, Wallet, Banknote, Building2, Calculator, Snowflake, Sun, AlertTriangle, PackageOpen, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const toBn = (n: number): string =>
  Math.round(n).toLocaleString("en").replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const Dashboard = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayIncome = 0 } = useQuery({
    queryKey: ["dash-today-income", today],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("amount").eq("type", "income").eq("date", today);
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: todayExpense = 0 } = useQuery({
    queryKey: ["dash-today-expense", today],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("amount").eq("type", "expense").eq("date", today);
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: totalIncome = 0 } = useQuery({
    queryKey: ["dash-total-income"],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("amount").eq("type", "income");
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: totalExpense = 0 } = useQuery({
    queryKey: ["dash-total-expense"],
    queryFn: async () => {
      const { data } = await supabase.from("daily_transactions").select("amount").eq("type", "expense");
      return data?.reduce((s, r) => s + Number(r.amount), 0) || 0;
    },
  });

  const { data: totalReceivable = 0 } = useQuery({
    queryKey: ["dash-receivable"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("current_balance").gt("current_balance", 0);
      return data?.reduce((s, r) => s + Number(r.current_balance), 0) || 0;
    },
  });

  const { data: totalLoanBorrowed = 0 } = useQuery({
    queryKey: ["dash-loan-borrowed"],
    queryFn: async () => {
      const { data } = await supabase.from("loans").select("opening_balance").eq("direction", "borrowed").eq("is_active", true);
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: bankBalance = 0 } = useQuery({
    queryKey: ["dash-bank"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("opening_balance").eq("is_active", true);
      return data?.reduce((s, r) => s + Number(r.opening_balance), 0) || 0;
    },
  });

  const { data: stockData = [] } = useQuery({
    queryKey: ["dash-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("v_shoe_stock").select("season, current_cartons");
      return data || [];
    },
  });

  const { data: dueParties = [] } = useQuery({
    queryKey: ["dashboard-due"],
    queryFn: async () => {
      const { data } = await supabase.from("v_party_balance").select("*").gt("current_balance", 0).order("current_balance", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("v_shoe_stock").select("*, articles:article_id(article_no)").lt("current_cartons", 5).gt("current_cartons", 0);
      return (data || []) as any[];
    },
  });

  const actualBalance = totalIncome - totalExpense;
  const remainingBalance = (totalIncome + totalReceivable) - (totalExpense + totalLoanBorrowed);
  const cashBalance = Math.max(0, totalIncome - totalExpense - bankBalance);
  const winterCartons = stockData.filter(s => s.season === "শীত" || s.season === "winter").reduce((s, r) => s + Number(r.current_cartons || 0), 0);
  const summerCartons = stockData.filter(s => s.season === "গরম" || s.season === "summer").reduce((s, r) => s + Number(r.current_cartons || 0), 0);

  const statCards = [
    { bn: "আজকের আয়", en: "Today's Income", value: todayIncome, gradient: "gradient-stat-green", glow: "card-glow-green", icon: TrendingUp, link: "/khata/daily" },
    { bn: "আজকের ব্যয়", en: "Today's Expense", value: todayExpense, gradient: "gradient-stat-red", glow: "card-glow-red", icon: TrendingDown, link: "/khata/daily" },
    { bn: "বাস্তব ব্যালেন্স", en: "Actual Balance", value: actualBalance, gradient: "gradient-stat-blue", glow: "card-glow-blue", icon: Wallet, link: "/khata/combined" },
    { bn: "অবশিষ্ট ব্যালেন্স", en: "Remaining Balance", value: remainingBalance, gradient: "gradient-stat-deep-purple", glow: "card-glow-deep-purple", icon: Calculator, formula: "(আয়+পাওনা) − (ব্যয়+দেনা)", link: "/summary/master" },
    { bn: "নগদ", en: "Cash", value: cashBalance, gradient: "gradient-stat-teal", glow: "card-glow-teal", icon: Banknote, link: "/khata/cash" },
    { bn: "ব্যাংক", en: "Bank", value: bankBalance, gradient: "gradient-stat-purple", glow: "card-glow-purple", icon: Building2, link: "/khata/bank" },
  ];

  const stockCards = [
    { bn: "শীত স্টক", en: "Winter Cartons", value: winterCartons, gradient: "gradient-stat-blue", glow: "card-glow-blue", icon: Snowflake, link: "/godown/stock" },
    { bn: "গরম স্টক", en: "Summer Cartons", value: summerCartons, gradient: "gradient-stat-orange", glow: "card-glow-orange", icon: Sun, link: "/godown/stock" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-bengali mb-0.5 text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-sm text-muted-foreground tracking-wide">Dashboard Overview</p>
        </div>
      </div>

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
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">৳{toBn(card.value)}</p>
              {"formula" in card && (card as any).formula && (
                <p className="text-[10px] opacity-60 mt-1.5 font-bengali bg-white/10 inline-block px-2 py-0.5 rounded-full">{(card as any).formula}</p>
              )}
            </div>
          </div>
        ))}
      </div>

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
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">{toBn(card.value)} কার্টন</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
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
                  <span className="font-bold text-destructive">৳{toBn(Number(p.current_balance || 0))}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/party/all-balance")} className="text-xs text-primary hover:underline font-bengali">বিস্তারিত দেখুন →</button>
        </div>

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
                  <span className="font-bold text-orange-500">{toBn(s.current_cartons)} কার্টন</span>
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