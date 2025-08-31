import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import PreProductionPage from "@/pages/PreProduction";
import PostProductionPage from "@/pages/PostProduction";
import Billing from "@/components/modules/Billing";
import BillingHistory from "@/components/modules/BillingHistory";
import CustomersPage from "@/pages/Customers";
import DatabasePage from "@/pages/Database";
import NotFoundPage from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContextProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<PreProductionPage />} />
              <Route path="pre-production" element={<PreProductionPage />} />
              <Route path="post-production" element={<PostProductionPage />} />
              <Route path="billing" element={<Billing />} />
              <Route path="billing-history" element={<BillingHistory />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppContextProvider>
  </QueryClientProvider>
);

export default App;
