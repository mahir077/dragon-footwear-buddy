import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Settings, CalendarDays, BookOpen, ShoppingCart,
  Factory, TrendingUp, Landmark, Users, Home, Shield, Recycle,
  ClipboardList, FileSpreadsheet, BarChart3, FileText, Cog, LogOut,
  ChevronDown, ChevronRight, Menu, X, Package, Warehouse, ArrowLeft,
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
  {
    bn: "দৈনিক খাতা", icon: BookOpen,
    children: [
      { bn: "এন্ট্রি", path: "/khata/entry" },
      { bn: "দৈনিক", path: "/khata/daily" },
      { bn: "ক্যাশ বই", path: "/khata/cash" },
      { bn: "ব্যাংক বই", path: "/khata/bank" },
      { bn: "সমন্বিত", path: "/khata/combined" },
    ],
  },
  {
    bn: "ক্রয়", icon: ShoppingCart,
    children: [
      { bn: "নতুন ক্রয়", path: "/purchase/new" },
      { bn: "ক্রয় তালিকা", path: "/purchase/list" },
      { bn: "সরবরাহকারী লেজার", path: "/purchase/supplier-ledger" },
      { bn: "কাঁচামাল স্টক", path: "/purchase/raw-stock" },
      { bn: "অগ্রিম", path: "/purchase/advance" },
    ],
  },
  {
    bn: "উৎপাদন", icon: Factory,
    children: [
      { bn: "নতুন উৎপাদন", path: "/production/entry" },
      { bn: "উৎপাদন তালিকা", path: "/production/list" },
      { bn: "গোডাউন স্টক", path: "/godown/stock" },
      { bn: "ড্যামেজ", path: "/godown/damage" },
      { bn: "ট্রান্সফার", path: "/godown/transfer" },
      { bn: "Reconciliation", path: "/production/reconciliation" },
    ],
  },
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
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = (path?: string) => path && (location.pathname === path || location.pathname.startsWith(path + "/"));
  const isChildActive = (children?: SubItem[]) => children?.some((c) => isActive(c.path));

  const toggleExpand = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  // Auto-expand parent if child is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setExpandedMenus((prev) => ({ ...prev, [item.bn]: true }));
      }
    });
  }, [location.pathname]);

  const sidebarW = collapsed ? "w-12" : "w-[220px]";

  const renderSidebar = (isMobile = false) => (
    <nav className="flex-1 py-2 overflow-y-auto">
      {menuItems.map((item) => {
        const iconSize = collapsed && !isMobile ? "w-5 h-5" : "w-4 h-4";
        if (item.children) {
          const expanded = expandedMenus[item.bn] || false;
          if (collapsed && !isMobile) {
            // Icon-only: show icon, tooltip-like
            return (
              <div key={item.bn} className="relative group">
                <button
                  onClick={() => toggleExpand(item.bn)}
                  className={`flex items-center justify-center w-full py-2.5 transition-colors ${
                    isChildActive(item.children) ? "bg-[hsl(213_52%_35%)]" : "hover:bg-[hsl(213_52%_30%)]"
                  }`}
                  title={item.bn}
                >
                  <item.icon className={`${iconSize} text-white/90`} />
                </button>
              </div>
            );
          }
          return (
            <div key={item.bn}>
              <button
                onClick={() => toggleExpand(item.bn)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors rounded-md mx-1 text-[14px] ${
                  isChildActive(item.children) ? "bg-[hsl(213_52%_35%)]" : "hover:bg-[hsl(213_52%_30%)]"
                }`}
                style={{ width: "calc(100% - 8px)" }}
              >
                <item.icon className={`${iconSize} shrink-0 text-white/90`} />
                <span className="flex-1 font-bengali text-white">{item.bn}</span>
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white/60" /> : <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
              </button>
              {expanded && (
                <div className="ml-7 mr-1 border-l-2 border-white/15 pl-2 my-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={closeMobileSidebar}
                      className={`block px-2 py-1.5 rounded text-[13px] font-bengali transition-colors ${
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

        if (collapsed && !isMobile) {
          return (
            <Link
              key={item.path}
              to={item.path!}
              className={`flex items-center justify-center py-2.5 transition-colors ${
                isActive(item.path) ? "bg-[hsl(213_52%_35%)]" : "hover:bg-[hsl(213_52%_30%)]"
              }`}
              title={item.bn}
            >
              <item.icon className={`${iconSize} text-white/90`} />
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path!}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md transition-colors text-[14px] ${
              isActive(item.path) ? "bg-[hsl(213_52%_35%)]" : "hover:bg-[hsl(213_52%_30%)]"
            }`}
          >
            <item.icon className={`${iconSize} shrink-0 text-white/90`} />
            <span className="font-bengali text-white">{item.bn}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground h-12 flex items-center justify-between px-3 shrink-0 z-40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="পিছনে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="text-center flex-1 md:text-left md:flex-none">
          <h1 className="text-sm md:text-base font-bold font-bengali leading-tight">ড্রাগন পিউ ফুটওয়্যার</h1>
          <p className="text-[10px] text-white/70 font-bengali leading-tight">{getBengaliDate()}</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md text-xs font-bengali font-semibold hover:opacity-90 transition-opacity"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex flex-col ${sidebarW} bg-primary text-white shrink-0 overflow-y-auto transition-all duration-200`}>
          {renderSidebar()}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileSidebar} />
            <aside className="fixed top-12 left-0 bottom-0 w-[260px] bg-primary text-white z-50 md:hidden overflow-y-auto shadow-2xl">
              {renderSidebar(true)}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
