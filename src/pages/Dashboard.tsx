import { TrendingUp, TrendingDown, Wallet, Banknote, Building2, Calculator, Snowflake, Sun, AlertTriangle, PackageOpen, ArrowUpRight } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

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
          <div
            key={card.en}
            onClick={() => navigate(card.link)}
            className={`${card.gradient} ${card.glow} group relative text-white rounded-2xl p-4 md:p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 overflow-hidden`}
          >
            {/* Decorative circle */}
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
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">
                ৳{toBengaliDigits(card.value)}
              </p>
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
          <div
            key={card.en}
            onClick={() => navigate(card.link)}
            className={`${card.gradient} ${card.glow} group relative text-white rounded-2xl p-4 md:p-5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 overflow-hidden`}
          >
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
              <p className="text-2xl md:text-3xl font-extrabold font-bengali tracking-tight">
                ৳{toBengaliDigits(card.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
        <div
          onClick={() => navigate("/khata/daily")}
          className="bg-card border border-destructive/20 rounded-2xl p-5 cursor-pointer hover:border-destructive/40 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-bengali text-foreground">বাকি পাওনা আছে</h3>
              <p className="text-sm font-bengali text-muted-foreground">এখন কোনো বাকি নেই</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div
          onClick={() => navigate("/godown/stock")}
          className="bg-card border border-stat-orange/20 rounded-2xl p-5 cursor-pointer hover:border-stat-orange/40 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-stat-orange/10">
              <PackageOpen className="h-5 w-5 text-stat-orange" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-bengali text-foreground">কম স্টক সতর্কতা</h3>
              <p className="text-sm font-bengali text-muted-foreground">স্টক স্বাভাবিক আছে</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
