import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import SetupIndex from "./pages/setup/SetupIndex";
import BrandsPage from "./pages/setup/BrandsPage";
import ModelsPage from "./pages/setup/ModelsPage";
import ArticlesPage from "./pages/setup/ArticlesPage";
import PartiesPage from "./pages/setup/PartiesPage";
import ColorsPage from "./pages/setup/ColorsPage";
import LocationsPage from "./pages/setup/LocationsPage";
import BanksPage from "./pages/setup/BanksPage";
import EmployeesPage from "./pages/setup/EmployeesPage";
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
// Sales Module
import SalesNewPage from "./pages/sales/SalesNewPage";
import SalesListPage from "./pages/sales/SalesListPage";
import PartyLedgerPage from "./pages/party/PartyLedgerPage";
import PartyAllBalancePage from "./pages/party/PartyAllBalancePage";
// Finance Module
import LoanBorrowedPage from "./pages/finance/LoanBorrowedPage";
import LoanLentPage from "./pages/finance/LoanLentPage";
import FdrPage from "./pages/finance/FdrPage";
// Employee Module
import AttendancePage from "./pages/employee/AttendancePage";
import SalaryPage from "./pages/employee/SalaryPage";
import EmployeeAdvancePage from "./pages/employee/EmployeeAdvancePage";
// Invoice Module
import InvoiceNewPage from "./pages/invoice/InvoiceNewPage";
import InvoiceListPage from "./pages/invoice/InvoiceListPage";
import WasteSalePage from "./pages/waste/WasteSalePage";

const queryClient = new QueryClient();

const placeholderRoutes = [
  "rent-commission", "capital-insurance", "waste-sales", "register",
  "excel", "summary", "system",
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup" element={<SetupIndex />} />
            <Route path="/setup/brands" element={<BrandsPage />} />
            <Route path="/setup/models" element={<ModelsPage />} />
            <Route path="/setup/articles" element={<ArticlesPage />} />
            <Route path="/setup/parties" element={<PartiesPage />} />
            <Route path="/setup/colors" element={<ColorsPage />} />
            <Route path="/setup/locations" element={<LocationsPage />} />
            <Route path="/setup/banks" element={<BanksPage />} />
            <Route path="/setup/employees" element={<EmployeesPage />} />
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
            <Route path="/godown/stock" element={<GodownStockPage />} />
            <Route path="/godown/damage" element={<DamagePage />} />
            <Route path="/godown/transfer" element={<TransferPage />} />
            <Route path="/production/reconciliation" element={<ReconciliationPage />} />
            {/* Sales */}
            <Route path="/sales/new" element={<SalesNewPage />} />
            <Route path="/sales/list" element={<SalesListPage />} />
            <Route path="/party/ledger" element={<PartyLedgerPage />} />
            <Route path="/party/all-balance" element={<PartyAllBalancePage />} />
            {/* Finance */}
            <Route path="/finance/loan-borrowed" element={<LoanBorrowedPage />} />
            <Route path="/finance/loan-lent" element={<LoanLentPage />} />
            <Route path="/finance/fdr" element={<FdrPage />} />
            {/* Employee */}
            <Route path="/employee/attendance" element={<AttendancePage />} />
            <Route path="/employee/salary" element={<SalaryPage />} />
            <Route path="/employee/advance" element={<EmployeeAdvancePage />} />
            {/* Invoice */}
            <Route path="/invoice/new" element={<InvoiceNewPage />} />
            <Route path="/invoice/list" element={<InvoiceListPage />} />
            <Route path="/waste/sale" element={<WasteSalePage />} />
            {placeholderRoutes.map((route) => (
              <Route key={route} path={`/${route}`} element={<PlaceholderPage />} />
            ))}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
