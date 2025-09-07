import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OllamaProvider } from "@/contexts/OllamaContext";
import Index from "./pages/Index";
import ApiSettings from "./pages/ApiSettings";
import { ModelManagement } from "./pages/ModelManagement";
import { ModelManagementSimple } from "./pages/ModelManagementSimple";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OllamaProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/api-settings" element={<ApiSettings />} />
            <Route path="/model-management" element={<ModelManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OllamaProvider>
  </QueryClientProvider>
);

export default App;
