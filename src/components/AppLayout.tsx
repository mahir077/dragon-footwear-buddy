import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Settings, CalendarDays, BookOpen, ShoppingCart,
  Factory, TrendingUp, Landmark, Users, Home, Shield, Recycle,
  ClipboardList, FileSpreadsheet, BarChart3, FileText, Cog, LogOut,
  ChevronDown, ChevronRight, Menu, X,
} from "lucide-react";

type SubItem = { bn: string; path: string };
type MenuItem = { bn: string; icon: any; path?: string; children?: SubItem[] };

const menuItems: MenuItem[] = [
  { bn: "ড্যাশবোর্ড", icon: LayoutDashboard, path: "/dashboard" },
  {
    bn: "সেটআপ", icon: Settings,
    children: [
      { bn: "ব্র্যান্ড", path: "/setup/brands" },
      { bn: "মডেল", path: "/setup/models" },
      { bn: "আর্টিকেল", path: "/setup/articles" },
      { bn: "পার্টি", path: "/setup/parties" },
      { bn: "রঙ", path: "/setup/colors" },
      { bn: "লোকেশন", path: "/setup/locations" },
      { bn: "ব্যাংক", path: "/setup/banks" },
      { bn: "কর্মচারী", path: "/setup/employees" },
    ],
  },
  { bn: "আর্থিক বছর", icon: CalendarDays, path: "/year/manage" },
  { bn: "দৈনিক খাতা", icon: BookOpen, path: "/khata/entry" },
  { bn: "ক্রয়", icon: ShoppingCart, path: "/purchase" },
  { bn: "উৎপাদন", icon: Factory, path: "/production" },
  { bn: "বিক্রয়", icon: TrendingUp, path: "/sales" },
  { bn: "ক্যাশ/ব্যাংক/লোন", icon: Landmark, path: "/cash-bank-loan" },
  { bn: "কর্মচারী", icon: Users, path: "/employee" },
  { bn: "ভাড়া ও কমিশন", icon: Home, path: "/rent-commission" },
  { bn: "মূলধন ও বীমা", icon: Shield, path: "/capital-insurance" },
  { bn: "বর্জ্য বিক্রি", icon: Recycle, path: "/waste-sales" },
  { bn: "রেজিস্টার", icon: ClipboardList, path: "/register" },
  { bn: "এক্সেল", icon: FileSpreadsheet, path: "/excel" },
  { bn: "সারসংক্ষেপ", icon: BarChart3, path: "/summary" },
  { bn: "ইনভয়েস", icon: FileText, path: "/invoice" },
  { bn: "সিস্টেম", icon: Cog, path: "/system" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ "সেটআপ": true });

  const isActive = (path?: string) => path && (location.pathname === path || location.pathname.startsWith(path + "/"));
  const isChildActive = (children?: SubItem[]) => children?.some((c) => isActive(c.path));

  const toggleExpand = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const renderSidebar = () => (
    <nav className="flex-1 py-3 overflow-y-auto">
      {menuItems.map((item) => {
        if (item.children) {
          const expanded = expandedMenus[item.bn] || isChildActive(item.children);
          return (
            <div key={item.bn}>
              <button
                onClick={() => toggleExpand(item.bn)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors rounded-lg mx-2 ${
                  isChildActive(item.children) ? "bg-[hsl(213_52%_35%)]" : "hover:bg-[hsl(213_52%_30%)]"
                }`}
                style={{ width: "calc(100% - 16px)" }}
              >
                <item.icon className="w-5 h-5 shrink-0 text-white/90" />
                <span className="flex-1 text-[15px] font-bengali text-white">{item.bn}</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-white/60" />}
              </button>
              {expanded && (
                <div className="ml-8 mr-2 border-l-2 border-white/15 pl-3 my-1 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={closeMobileSidebar}
                      className={`block px-3 py-2 rounded-md text-[14px] font-bengali transition-colors ${
                        isActive(child.path)
                          ? "bg-[hsl(213_52%_35%)] text-white font-semibold"
                          : "text-white/75 hover:bg-[hsl(213_52%_30%)] hover:text-white"
                      }`}
                    >
                      {child.bn}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path!}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? "bg-[hsl(213_52%_35%)]"
                : "hover:bg-[hsl(213_52%_30%)]"
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0 text-white/90" />
            <span className="text-[15px] font-bengali text-white">{item.bn}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground h-14 flex items-center justify-between px-4 shrink-0 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="text-center flex-1 md:text-left md:flex-none md:ml-0">
          <h1 className="text-base md:text-lg font-bold font-bengali leading-tight">ড্রাগন পিউ ফুটওয়্যার</h1>
          <p className="text-[11px] text-white/70 font-bengali leading-tight">{getBengaliDate()}</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md text-sm font-bengali font-semibold hover:opacity-90 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-[260px] bg-primary text-white shrink-0 overflow-y-auto">
          {renderSidebar()}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileSidebar} />
            <aside className="fixed top-14 left-0 bottom-0 w-[280px] bg-primary text-white z-50 md:hidden overflow-y-auto shadow-2xl">
              {renderSidebar()}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
