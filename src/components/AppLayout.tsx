import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Settings, CalendarDays, BookOpen, ShoppingCart,
  Factory, TrendingUp, Landmark, Users, Home, Shield, Recycle,
  ClipboardList, FileSpreadsheet, BarChart3, FileText, Cog, LogOut,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

type MenuItem = {
  bn: string; en: string; icon: any; path?: string;
  children?: { bn: string; en: string; path: string }[];
};

const menuItems: MenuItem[] = [
  { bn: "ড্যাশবোর্ড", en: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    bn: "সেটআপ", en: "Setup", icon: Settings,
    children: [
      { bn: "সেটআপ হোম", en: "Setup Home", path: "/setup" },
      { bn: "ব্র্যান্ড", en: "Brands", path: "/setup/brands" },
      { bn: "মডেল", en: "Models", path: "/setup/models" },
      { bn: "আর্টিকেল", en: "Articles", path: "/setup/articles" },
      { bn: "পার্টি", en: "Parties", path: "/setup/parties" },
      { bn: "রং", en: "Colors", path: "/setup/colors" },
      { bn: "লোকেশন", en: "Locations", path: "/setup/locations" },
      { bn: "ব্যাংক", en: "Banks", path: "/setup/banks" },
      { bn: "কর্মচারী", en: "Employees", path: "/setup/employees" },
    ],
  },
  {
    bn: "আর্থিক বছর", en: "Fiscal Year", icon: CalendarDays,
    children: [
      { bn: "বছর ব্যবস্থাপনা", en: "Manage Years", path: "/year/manage" },
      { bn: "পোস্টিং", en: "Postings", path: "/year/postings" },
    ],
  },
  {
    bn: "দৈনিক খাতা", en: "Daily Ledger", icon: BookOpen,
    children: [
      { bn: "এন্ট্রি", en: "Entry", path: "/khata/entry" },
      { bn: "দৈনিক তালিকা", en: "Daily List", path: "/khata/daily" },
      { bn: "নগদ বই", en: "Cash Book", path: "/khata/cash" },
      { bn: "ব্যাংক বই", en: "Bank Book", path: "/khata/bank" },
      { bn: "সমন্বিত", en: "Combined", path: "/khata/combined" },
    ],
  },
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
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isChildActive = (children?: { path: string }[]) =>
    children?.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"));

  const handleLogout = () => navigate("/");

  // Flat items for mobile bottom nav
  const mobileItems = menuItems.filter((m) => m.path).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
        <h1 className="text-lg md:text-xl font-bold font-bengali">ড্রাগন পিউ ফুটওয়্যার</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bengali hidden sm:block">{getBengaliDate()}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-bengali font-semibold hover:opacity-90 transition-opacity">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-64 bg-primary text-primary-foreground overflow-y-auto shrink-0">
          <nav className="flex-1 py-2">
            {menuItems.map((item) => {
              if (item.children) {
                const isOpen = openMenus[item.bn] || isChildActive(item.children);
                return (
                  <div key={item.bn}>
                    <button
                      onClick={() => toggleMenu(item.bn)}
                      className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors w-full text-left ${isChildActive(item.children) ? "bg-white/20 font-bold" : "hover:bg-white/10"}`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bengali leading-tight truncate">{item.bn}</div>
                        <div className="text-[11px] opacity-70 leading-tight">{item.en}</div>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="ml-6 border-l border-white/20 pl-2 my-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={`block px-3 py-2 mx-1 rounded-md text-sm font-bengali transition-colors ${location.pathname === child.path ? "bg-white/20 font-bold" : "hover:bg-white/10"}`}
                            activeClassName=""
                          >
                            {child.bn}
                            <span className="text-[10px] opacity-60 ml-1">{child.en}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path!}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors ${isActive ? "bg-white/20 font-bold" : "hover:bg-white/10"}`}
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

        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground z-30 border-t border-white/10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {menuItems.slice(0, 8).map((item) => {
            const path = item.path || item.children?.[0]?.path || "/";
            const isActive = item.path ? location.pathname === item.path : isChildActive(item.children);
            return (
              <NavLink
                key={item.bn}
                to={path}
                className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-2 text-center shrink-0 transition-colors ${isActive ? "bg-white/20" : ""}`}
                activeClassName=""
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bengali leading-tight whitespace-nowrap">{item.bn}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
