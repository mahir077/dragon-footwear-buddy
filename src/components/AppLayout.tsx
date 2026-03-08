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
  {
    bn: "বিক্রয়", icon: TrendingUp,
    children: [
      { bn: "নতুন বিক্রয়", path: "/sales/new" },
      { bn: "বিক্রয় তালিকা", path: "/sales/list" },
      { bn: "পার্টি লেজার", path: "/party/ledger" },
      { bn: "সব পার্টি ব্যালেন্স", path: "/party/all-balance" },
    ],
  },
  {
    bn: "ক্যাশ/ব্যাংক/লোন", icon: Landmark,
    children: [
      { bn: "দৈনিক নগদ", path: "/khata/cash" },
      { bn: "ব্যাংক লেজার", path: "/khata/bank" },
      { bn: "লোন নেওয়া", path: "/finance/loan-borrowed" },
      { bn: "লোন দেওয়া", path: "/finance/loan-lent" },
      { bn: "FDR/সঞ্চয়", path: "/finance/fdr" },
    ],
  },
  {
    bn: "কর্মচারী", icon: Users,
    children: [
      { bn: "উপস্থিতি", path: "/employee/attendance" },
      { bn: "বেতন শিট", path: "/employee/salary" },
      { bn: "অগ্রিম", path: "/employee/advance" },
    ],
  },
  { bn: "ভাড়া ও কমিশন", icon: Home, path: "/rent-commission" },
  { bn: "মূলধন ও বীমা", icon: Shield, path: "/capital-insurance" },
  { bn: "বর্জ্য বিক্রি", icon: Recycle, path: "/waste-sales" },
  { bn: "রেজিস্টার", icon: ClipboardList, path: "/register" },
  { bn: "এক্সেল", icon: FileSpreadsheet, path: "/excel" },
  { bn: "সারসংক্ষেপ", icon: BarChart3, path: "/summary" },
  {
    bn: "ইনভয়েস", icon: FileText,
    children: [
      { bn: "নতুন ইনভয়েস", path: "/invoice/new" },
      { bn: "ইনভয়েস তালিকা", path: "/invoice/list" },
    ],
  },
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

  const sidebarW = collapsed ? "w-14" : "w-[230px]";

  const activeClass = "bg-[#2563A8] text-white font-semibold border-l-4 border-[#16A34A]";
  const hoverClass = "hover:bg-[#243F6B] text-white/90 border-l-4 border-transparent";
  const activeChildClass = "bg-[#2563A8]/60 text-white font-semibold border-l-4 border-[#16A34A]";

  const renderSidebar = (isMobile = false) => (
    <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
      {/* Dragon Logo Area */}
      {(!collapsed || isMobile) && (
        <div className="flex items-center gap-2.5 px-3 py-3 mb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-[#16A34A] flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">🐉</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ড্রাগন পিউ</p>
            <p className="text-[#CBD5E1] text-[10px] leading-tight">ফুটওয়্যার ম্যানেজমেন্ট</p>
          </div>
        </div>
      )}
      {collapsed && !isMobile && (
        <div className="flex justify-center py-3 mb-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#16A34A] flex items-center justify-center shadow-md">
            <span className="text-white text-sm">🐉</span>
          </div>
        </div>
      )}

      {menuItems.map((item) => {
        const iconSize = collapsed && !isMobile ? "w-5 h-5" : "w-[18px] h-[18px]";
        if (item.children) {
          const expanded = expandedMenus[item.bn] || false;
          if (collapsed && !isMobile) {
            return (
              <div key={item.bn} className="relative group">
                <button
                  onClick={() => toggleExpand(item.bn)}
                  className={`flex items-center justify-center w-full py-2.5 rounded-lg transition-all ${
                    isChildActive(item.children) ? "bg-[#2563A8] text-white" : "hover:bg-[#243F6B] text-white/80"
                  }`}
                  title={item.bn}
                >
                  <item.icon className={`${iconSize}`} />
                </button>
              </div>
            );
          }
          return (
            <div key={item.bn}>
              <button
                onClick={() => toggleExpand(item.bn)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-all rounded-lg text-[14px] font-medium ${
                  isChildActive(item.children) ? activeClass : hoverClass
                }`}
              >
                <item.icon className={`${iconSize} shrink-0`} />
                <span className="flex-1 text-white">{item.bn}</span>
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
              </button>
              {expanded && (
                <div className="ml-8 mr-1 border-l border-[#2D4F7C] pl-2 my-1 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={closeMobileSidebar}
                      className={`block px-2.5 py-1.5 rounded-md text-[13px] transition-all ${
                        isActive(child.path)
                          ? "bg-[#2563A8]/50 text-white font-semibold border-l-2 border-[#16A34A]"
                          : "text-[#CBD5E1] hover:bg-[#243F6B] hover:text-white"
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
              className={`flex items-center justify-center py-2.5 rounded-lg transition-all ${
                isActive(item.path) ? "bg-[#2563A8] text-white" : "hover:bg-[#243F6B] text-white/80"
              }`}
              title={item.bn}
            >
              <item.icon className={`${iconSize}`} />
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path!}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[14px] font-medium ${
              isActive(item.path) ? activeClass : hoverClass
            }`}
          >
            <item.icon className={`${iconSize} shrink-0`} />
            <span className="text-white">{item.bn}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="gradient-header text-white h-13 flex items-center justify-between px-4 shrink-0 z-40 shadow-lg">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              title="পিছনে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="text-center flex-1 md:text-left md:flex-none">
          <h1 className="text-sm md:text-base font-extrabold font-bengali leading-tight tracking-wide">ড্রাগন পিউ ফুটওয়্যার</h1>
          <p className="text-[10px] text-white/60 font-bengali leading-tight">{getBengaliDate()}</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-destructive text-white px-3 py-1.5 rounded-lg text-xs font-bengali font-semibold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex flex-col ${sidebarW} gradient-sidebar text-white shrink-0 overflow-y-auto transition-all duration-300 border-r border-white/5`}>
          {renderSidebar()}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={closeMobileSidebar} />
            <aside className="fixed top-[3.25rem] left-0 bottom-0 w-[260px] gradient-sidebar text-white z-50 md:hidden overflow-y-auto shadow-2xl border-r border-white/5">
              {renderSidebar(true)}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
