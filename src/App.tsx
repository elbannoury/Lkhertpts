import { Toaster } from "@/components/ui/toaster";
import { captureRefFromUrl } from "@/lib/affiliate";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/contexts/I18nContext";
import { CartProvider } from "@/contexts/CartContext";
import Shell from "@/components/Shell";
import Inspiration from "@/components/sections/Inspiration";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CollectionPage from "./pages/CollectionPage";
import CollectionsPage from "./pages/CollectionsPage";
import RoomPage from "./pages/RoomPage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmed from "./pages/OrderConfirmed";
import Visualize from "./pages/Visualize";
import OwnerAdmin from "./pages/OwnerAdmin";
import OrderTracking from "./pages/OrderTracking";
import CustomPoster from "./pages/CustomPoster";
import ShopPage from "./pages/ShopPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AffiliateDashboard from "./pages/AffiliateDashboard";


const queryClient = new QueryClient();

const InspirationPage = () => (
  <Shell>
    <div className="pt-6"><Inspiration /></div>
  </Shell>
);

// Runs once when the app first loads — catches ?ref=CODE no matter which page
// the customer actually lands on (most commonly a shared product link), not
// just the homepage.
captureRefFromUrl();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <I18nProvider>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/inspiration" element={<InspirationPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/collections/:handle" element={<CollectionPage />} />
                <Route path="/rooms/:name" element={<RoomPage />} />
                <Route path="/products/:handle" element={<ProductPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmed/:id" element={<OrderConfirmed />} />
                <Route path="/visualize" element={<Visualize />} />
                <Route path="/adminsofpitsiky" element={<OwnerAdmin portal="admin" />} />
                <Route path="/theownerofpts1" element={<OwnerAdmin portal="owner" />} />


                <Route path="/track" element={<OrderTracking />} />
                <Route path="/custom" element={<CustomPoster />} />
                <Route path="/custom-poster" element={<CustomPoster />} />
                <Route path="/aff" element={<AffiliateDashboard />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </CartProvider>
    </I18nProvider>
  </ThemeProvider>
);

export default App;
 
