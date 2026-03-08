import { TrendingUp, TrendingDown, Wallet, Banknote, Building2, Package, Calculator, Snowflake, Sun, AlertTriangle, PackageOpen } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const toBengaliDigits = (n: number): string => {
  const digits = "০১২৩৪৫৬৭৮৯";
  return n.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
};

const statCards = [
  { bn: "আজকের আয়", en: "Today's Income", icon: TrendingUp, value: 0, color: "bg-stat-green" },
  { bn: "আজকের ব্যয়", en: "Today's Expense", icon: TrendingDown, value: 0, color: "bg-stat-red" },
  { bn: "বাস্তব ব্যালেন্স", en: "Actual Balance", icon: Wallet, value: 0, color: "bg-stat-blue" },
  { bn: "অবশিষ্ট ব্যালেন্স", en: "Remaining Balance", icon: Calculator, value: 0, color: "bg-stat-deep-purple", formula: "(আয়+পাওনা) − (ব্যয়+দেনা)" },
  { bn: "নগদ", en: "Cash", icon: Banknote, value: 0, color: "bg-stat-teal" },
  { bn: "ব্যাংক", en: "Bank", icon: Building2, value: 0, color: "bg-stat-purple" },
];

const stockCards = [
  { bn: "শীত স্টক", en: "Winter Cartons", icon: Snowflake, value: 0, color: "bg-stat-blue" },
  { bn: "গরম স্টক", en: "Summer Cartons", icon: Sun, value: 0, color: "bg-stat-orange" },
];

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold font-bengali mb-1">ড্যাশবোর্ড</h1>
      <p className="text-sm text-muted-foreground mb-6">Dashboard</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.en}
            className={`${card.color} text-white rounded-xl p-5 shadow-lg`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold font-bengali leading-tight">{card.bn}</h3>
                <p className="text-[11px] opacity-80">{card.en}</p>
              </div>
              <card.icon className="w-8 h-8 opacity-80 shrink-0" />
            </div>
            <p className="text-3xl font-bold font-bengali">
              ৳{toBengaliDigits(card.value)}
            </p>
            {"formula" in card && card.formula && (
              <p className="text-xs opacity-70 mt-1 font-bengali">{card.formula}</p>
            )}
          </div>
        ))}
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {stockCards.map((card) => (
          <div
            key={card.en}
            className={`${card.color} text-white rounded-xl p-5 shadow-lg`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold font-bengali leading-tight">{card.bn}</h3>
                <p className="text-[11px] opacity-80">{card.en}</p>
              </div>
              <card.icon className="w-8 h-8 opacity-80 shrink-0" />
            </div>
            <p className="text-3xl font-bold font-bengali">
              ৳{toBengaliDigits(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Alert Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Alert className="border-2 border-destructive bg-destructive/5 p-5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-lg font-bold font-bengali">⚠️ বাকি পাওনা আছে</AlertTitle>
          <AlertDescription className="text-base font-bengali text-muted-foreground mt-1">
            এখন কোনো বাকি নেই
          </AlertDescription>
        </Alert>

        <Alert className="border-2 border-stat-orange bg-stat-orange/5 p-5">
          <PackageOpen className="h-5 w-5 text-stat-orange" />
          <AlertTitle className="text-lg font-bold font-bengali">📦 কম স্টক সতর্কতা</AlertTitle>
          <AlertDescription className="text-base font-bengali text-muted-foreground mt-1">
            স্টক স্বাভাবিক আছে
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Dashboard;
