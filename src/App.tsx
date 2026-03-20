import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import ExcelPage from "./pages/ExcelPage";
import Dashboard from "./pages/Dashboard";
import IncomeHeadsPage from "./pages/setup/IncomeHeadsPage";
import ExpenseHeadsPage from "./pages/setup/ExpenseHeadsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import SetupIndex from "./pages/setup/SetupIndex";
import BrandsPage from "./pages/setup/BrandsPage";
import ModelsPage from "./pages/setup/ModelsPage";
import ArticlesPage from "./pages/setup/ArticlesPage";
import PartiesPage from "./pages/setup/PartiesPage";
import PartyPaymentPage from "@/pages/party/PartyPaymentPage";
import ColorsPage from "./pages/setup/ColorsPage";
import LocationsPage from "./pages/setup/LocationsPage";
import BanksPage from "./pages/setup/BanksPage";
import EmployeesPage from "./pages/setup/EmployeesPage";
import RawMaterialsPage from "./pages/setup/RawMaterialsPage";
import ChartOfAccountsPage from "./pages/accounting/ChartOfAccountsPage";
import JournalEntryPage from "./pages/accounting/JournalEntryPage";
import TrialBalancePage from "./pages/accounting/TrialBalancePage";
import BalanceSheetPage from "./pages/accounting/BalanceSheetPage";
import ProfitLossPage from "./pages/accounting/ProfitLossPage";
import FinancialYearsPage from "./pages/year/FinancialYearsPage";
import YearPostingsPage from "./pages/year/YearPostingsPage";
import KhataEntryPage from "./pages/khata/KhataEntryPage";
import KhataDailyPage from "./pages/khata/KhataDailyPage";
import KhataCashPage from "./pages/khata/KhataCashPage";
import KhataBankPage from "./pages/khata/KhataBankPage";
import KhataCombinedPage from "./pages/khata/KhataCombinedPage";
import PurchaseNewPage from "./pages/purchase/PurchaseNewPage";
import PurchaseListPage from "./pages/purchase/PurchaseListPage";
import SupplierLedgerPage from "./pages/purchase/SupplierLedgerPage";
import RawStockPage from "./pages/purchase/RawStockPage";
import AdvancePage from "./pages/purchase/AdvancePage";
import ProductionEntryPage from "./pages/production/ProductionEntryPage";
import ProductionListPage from "./pages/production/ProductionListPage";
import GodownStockPage from "./pages/godown/GodownStockPage";
import DamagePage from "./pages/godown/DamagePage";
import TransferPage from "./pages/godown/TransferPage";
import ReconciliationPage from "./pages/production/ReconciliationPage";
import SalesNewPage from "./pages/sales/SalesNewPage";
import SalesListPage from "./pages/sales/SalesListPage";
import PartyLedgerPage from "./pages/party/PartyLedgerPage";
import PartyAllBalancePage from "./pages/party/PartyAllBalancePage";
import LoanBorrowedPage from "./pages/finance/LoanBorrowedPage";
import LoanLentPage from "./pages/finance/LoanLentPage";
import FdrPage from "./pages/finance/FdrPage";
import AttendancePage from "./pages/employee/AttendancePage";
import SalaryPage from "./pages/employee/SalaryPage";
import EmployeeAdvancePage from "./pages/employee/EmployeeAdvancePage";
import InvoiceNewPage from "./pages/invoice/InvoiceNewPage";
import InvoiceListPage from "./pages/invoice/InvoiceListPage";
import WasteSalePage from "./pages/waste/WasteSalePage";
import FactoryRentPage from "./pages/rent/FactoryRentPage";
import GodownRentPage from "./pages/rent/GodownRentPage";
import CommissionPage from "./pages/rent/CommissionPage";
import CapitalStatementPage from "./pages/capital/CapitalStatementPage";
import CompanyDepositPage from "./pages/capital/CompanyDepositPage";
import LifeInsurancePage from "./pages/insurance/LifeInsurancePage";
import PadukaSamitiPage from "./pages/insurance/PadukaSamitiPage";
import PfPage from "./pages/insurance/PfPage";
import MachineryPage from "./pages/asset/MachineryPage";
import FurniturePage from "./pages/asset/FurniturePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/system/SettingsPage";
import RolesPage from "./pages/system/RolesPage";
import AuditPage from "./pages/system/AuditPage";
import MasterSummaryPage from "./pages/summary/MasterSummaryPage";
import PartySummaryPage from "./pages/summary/PartySummaryPage";
import BrandSummaryPage from "./pages/summary/BrandSummaryPage";
import StockSummaryPage from "./pages/summary/StockSummaryPage";
import MonthlyExpensePage from "./pages/summary/MonthlyExpensePage";
import BOMSetupPage from "./pages/production/BOMSetupPage";


const queryClient = new QueryClient();
const placeholderRoutes: string[] = [];

// ✅ Auth + Role context
const useAuth = () => {
  const [session, setSession] = useState<any>(undefined);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) fetchRole(data.session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s?.user?.id) fetchRole(s.user.id);
      else setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await (supabase as any).from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    setRole(data?.role || "user");
  };

  return { session, role };
};

// ✅ Protected Route — login check
const ProtectedRoute = ({ children, session }: { children: React.ReactNode; session: any }) => {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-white font-bengali text-xl animate-pulse">লোড হচ্ছে...</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ✅ Admin Only Route — super_admin + admin
const AdminRoute = ({ children, role }: { children: React.ReactNode; role: string | null }) => {
  if (role === null) return null;
  if (role !== "super_admin" && role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-4xl">🔒</p>
          <p className="font-bengali text-lg font-bold">অনুমতি নেই</p>
          <p className="text-sm text-muted-foreground">এই পেজে প্রবেশের অনুমতি নেই</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// ✅ Super Admin Only Route
const SuperAdminRoute = ({ children, role }: { children: React.ReactNode; role: string | null }) => {
  if (role === null) return null;
  if (role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-4xl">👑</p>
          <p className="font-bengali text-lg font-bold">শুধু সুপার অ্যাডমিন</p>
          <p className="text-sm text-muted-foreground">এই পেজটি শুধুমাত্র সুপার অ্যাডমিনের জন্য</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const App = () => {
  const { session, role } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Login />} />

              {/* Protected — all logged in users */}
              <Route element={<ProtectedRoute session={session}><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/setup" element={<SetupIndex />} />
                <Route path="/setup/raw-materials" element={<RawMaterialsPage />} />
                <Route path="/accounting/chart-of-accounts" element={<ChartOfAccountsPage />} />
                <Route path="/accounting/trial-balance" element={<TrialBalancePage />} />
                <Route path="/accounting/balance-sheet" element={<BalanceSheetPage />} />
                <Route path="/accounting/profit-loss" element={<ProfitLossPage />} />
                <Route path="/setup/brands" element={<BrandsPage />} />
                <Route path="/setup/models" element={<ModelsPage />} />
                <Route path="/setup/articles" element={<ArticlesPage />} />
                <Route path="/setup/parties" element={<PartiesPage />} />
                <Route path="/setup/colors" element={<ColorsPage />} />
                <Route path="/setup/locations" element={<LocationsPage />} />
                <Route path="/setup/banks" element={<BanksPage />} />
                <Route path="/setup/employees" element={<EmployeesPage />} />
                <Route path="/setup/income-heads" element={<IncomeHeadsPage />} />
                <Route path="/setup/expense-heads" element={<ExpenseHeadsPage />} />
                <Route path="/year/manage" element={<FinancialYearsPage />} />
                <Route path="/year/postings" element={<YearPostingsPage />} />
                <Route path="/khata/entry" element={<KhataEntryPage />} />
                <Route path="/khata/daily" element={<KhataDailyPage />} />
                <Route path="/khata/cash" element={<KhataCashPage />} />
                <Route path="/khata/bank" element={<KhataBankPage />} />
                <Route path="/khata/combined" element={<KhataCombinedPage />} />
                <Route path="/purchase/new" element={<PurchaseNewPage />} />
                <Route path="/purchase/list" element={<PurchaseListPage />} />
                <Route path="/purchase/supplier-ledger" element={<SupplierLedgerPage />} />
                <Route path="/purchase/raw-stock" element={<RawStockPage />} />
                <Route path="/purchase/advance" element={<AdvancePage />} />
                <Route path="/production/entry" element={<ProductionEntryPage />} />
                <Route path="/production/list" element={<ProductionListPage />} />
                <Route path="/production/bom" element={<BOMSetupPage />} />
                <Route path="/godown/stock" element={<GodownStockPage />} />
                <Route path="/godown/damage" element={<DamagePage />} />
                <Route path="/godown/transfer" element={<TransferPage />} />
                <Route path="/production/reconciliation" element={<ReconciliationPage />} />
                <Route path="/parties/payment" element={<PartyPaymentPage />} />
                <Route path="/sales/new" element={<SalesNewPage />} />
                <Route path="/sales/list" element={<SalesListPage />} />
                <Route path="/party/ledger" element={<PartyLedgerPage />} />
                <Route path="/party/all-balance" element={<PartyAllBalancePage />} />
                <Route path="/finance/loan-borrowed" element={<LoanBorrowedPage />} />
                <Route path="/finance/loan-lent" element={<LoanLentPage />} />
                <Route path="/finance/fdr" element={<FdrPage />} />
                <Route path="/employee/attendance" element={<AttendancePage />} />
                <Route path="/employee/salary" element={<SalaryPage />} />
                <Route path="/employee/advance" element={<EmployeeAdvancePage />} />
                <Route path="/invoice/new" element={<InvoiceNewPage />} />
                <Route path="/invoice/list" element={<InvoiceListPage />} />
                <Route path="/waste/sale" element={<WasteSalePage />} />
                <Route path="/rent/factory" element={<FactoryRentPage />} />
                <Route path="/rent/godown" element={<GodownRentPage />} />
                <Route path="/rent/commission" element={<CommissionPage />} />
                <Route path="/capital/statement" element={<CapitalStatementPage />} />
                <Route path="/capital/deposit" element={<CompanyDepositPage />} />
                <Route path="/insurance/life" element={<LifeInsurancePage />} />
                <Route path="/insurance/paduka" element={<PadukaSamitiPage />} />
                <Route path="/insurance/pf" element={<PfPage />} />
                <Route path="/asset/machinery" element={<MachineryPage />} />
                <Route path="/asset/furniture" element={<FurniturePage />} />
                <Route path="/summary/master" element={<MasterSummaryPage />} />
                <Route path="/summary/party" element={<PartySummaryPage />} />
                <Route path="/summary/brand" element={<BrandSummaryPage />} />
                <Route path="/summary/stock" element={<StockSummaryPage />} />
                <Route path="/summary/monthly-expense" element={<MonthlyExpensePage />} />
                <Route path="/accounting/monthly-expense" element={<MonthlyExpensePage />} />
                <Route path="/excel" element={<ExcelPage />} />
                

                {/* ✅ Admin only routes */}
                <Route path="/accounting/journal" element={<AdminRoute role={role}><JournalEntryPage /></AdminRoute>} />
                <Route path="/register" element={<AdminRoute role={role}><RegisterPage /></AdminRoute>} />
                <Route path="/system/settings" element={<AdminRoute role={role}><SettingsPage /></AdminRoute>} />
                <Route path="/system/audit" element={<AdminRoute role={role}><AuditPage /></AdminRoute>} />

                {/* ✅ Super Admin only routes */}
                <Route path="/system/roles" element={<SuperAdminRoute role={role}><RolesPage /></SuperAdminRoute>} />

                {placeholderRoutes.map((route) => (
                  <Route key={route} path={`/${route}`} element={<PlaceholderPage />} />
                ))}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;