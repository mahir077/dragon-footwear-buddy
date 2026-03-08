import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Settings, CalendarDays, BookOpen, ShoppingCart,
  Factory, TrendingUp, Landmark, Users, Home, Shield, Recycle,
  ClipboardList, FileSpreadsheet, BarChart3, FileText, Cog, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

const menuItems = [
  { bn: "ড্যাশবোর্ড", en: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { bn: "সেটআপ", en: "Setup", icon: Settings, path: "/setup" },
  { bn: "আর্থিক বছর", en: "Fiscal Year", icon: CalendarDays, path: "/fiscal-year" },
  { bn: "দৈনিক খাতা", en: "Daily Ledger", icon: BookOpen, path: "/daily-ledger" },
  { bn: "ক্রয়", en: "Purchase", icon: ShoppingCart, path: "/purchase" },
  { bn: "উৎপাদন", en: "Production", icon: Factory, path: "/production" },
  { bn: "বিক্রয়", en: "Sales", icon: TrendingUp, path: "/sales" },
  { bn: "ক্যাশ/ব্যাংক/লোন", en: "Cash/Bank/Loan", icon: Landmark, path: "/cash-bank-loan" },
  { bn: "কর্মচারী", en: "Employee", icon: Users, path: "/employee" },
  { bn: "ভাড়া ও কমিশন", en: "Rent & Commission", icon: Home, path: "/rent-commission" },
  { bn: "মূলধন ও বীমা", en: "Capital & Insurance", icon: Shield, path: "/capital-insurance" },
  { bn: "বর্জ্য বিক্রি", en: "Waste Sales", icon: Recycle, path: "/waste-sales" },
  { bn: "রেজিস্টার", en: "Register", icon: ClipboardList, path: "/register" },
  { bn: "এক্সেল", en: "Excel", icon: FileSpreadsheet, path: "/excel" },
  { bn: "সারসংক্ষেপ", en: "Summary", icon: BarChart3, path: "/summary" },
  { bn: "ইনভয়েস", en: "Invoice", icon: FileText, path: "/invoice" },
  { bn: "সিস্টেম", en: "System", icon: Cog, path: "/system" },
];

const toBengaliDigits = (n: number): string => {
  const digits = "০১২৩৪৫৬৭৮৯";
  return n.toString().replace(/\d/g, (d) => digits[parseInt(d)]);
};

const getBengaliDate = (): string => {
  const months = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];
  const now = new Date();
  return `${toBengaliDigits(now.getDate())} ${months[now.getMonth()]} ${toBengaliDigits(now.getFullYear())}`;
};

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-primary text-primary-foreground h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
        <h1 className="text-lg md:text-xl font-bold font-bengali">
          ড্রাগন পিউ ফুটওয়্যার
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bengali hidden sm:block">
            {getBengaliDate()}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-bengali font-semibold hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-primary text-primary-foreground overflow-y-auto shrink-0">
          <nav className="flex-1 py-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }`}
                  activeClassName=""
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-base font-bengali leading-tight truncate">{item.bn}</div>
                    <div className="text-[11px] opacity-70 leading-tight">{item.en}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground z-30 border-t border-white/10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-2 text-center shrink-0 transition-colors ${
                  isActive ? "bg-white/20" : ""
                }`}
                activeClassName=""
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bengali leading-tight whitespace-nowrap">
                  {item.bn}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
