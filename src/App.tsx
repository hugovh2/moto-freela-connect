import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CapacitorProvider } from "@/components/CapacitorProvider";
import { NativeFeaturesDemo } from "@/components/NativeFeaturesDemo";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompanyDashboard from "./pages/CompanyDashboard";
import MotoboyDashboard from "./pages/MotoboyDashboard";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";

const queryClient = new QueryClient();

const App = () => {
  console.log('🚀 App iniciando...');
  
  return (
    <CapacitorProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/company" 
                element={
                  <ProtectedRoute requiredRole="company">
                    <CompanyDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/motoboy" 
                element={
                  <ProtectedRoute requiredRole="motoboy">
                    <MotoboyDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/test-native" element={<NativeFeaturesDemo />} />
              <Route path="/debug" element={<Debug />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </CapacitorProvider>
  );
};

export default App;
