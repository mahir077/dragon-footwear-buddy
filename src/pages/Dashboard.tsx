import { TrendingUp, TrendingDown, Wallet, Banknote, Building2, Package } from "lucide-react";

const toBengaliDigits = (n: number): string => {
  const digits = "০১২৩৪৫৬৭৮৯";
  return n.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
};

const statCards = [
  { bn: "আজকের আয়", en: "Today's Income", icon: TrendingUp, value: 0, color: "bg-stat-green" },
  { bn: "আজকের ব্যয়", en: "Today's Expense", icon: TrendingDown, value: 0, color: "bg-stat-red" },
  { bn: "বাস্তব ব্যালেন্স", en: "Actual Balance", icon: Wallet, value: 0, color: "bg-stat-blue" },
  { bn: "নগদ", en: "Cash", icon: Banknote, value: 0, color: "bg-stat-teal" },
  { bn: "ব্যাংক", en: "Bank", icon: Building2, value: 0, color: "bg-stat-purple" },
  { bn: "গোডাউন স্টক", en: "Godown Stock", icon: Package, value: 0, color: "bg-stat-orange" },
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
