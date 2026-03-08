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

const queryClient = new QueryClient();

const placeholderRoutes = [
  "purchase", "production", "sales", "cash-bank-loan", "employee",
  "rent-commission", "capital-insurance", "waste-sales", "register",
  "excel", "summary", "invoice", "system",
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
