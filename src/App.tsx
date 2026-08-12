import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';
import { CartProvider } from './lib/cart';
import { AuthProvider } from './lib/auth';
import { WishlistProvider } from './lib/wishlist';
import { trackEvent } from './lib/track';
import Admin from "./pages/admin"
import Login from "./pages/login"
import Signup from "./pages/signup"
import Home from './pages/home';
import Shop from './pages/shop';
import Collection from './pages/collection';
import Product from './pages/product';
import Checkout from './pages/checkout';
import OrderConfirmation from './pages/order-confirmation';
import Wishlist from './pages/wishlist';
import About from './pages/about';
import Journal from './pages/journal';
import Contact from './pages/contact';
import PolicyPage from './pages/policy';
import NotFound from './pages/not-found';

const queryClient = new QueryClient();

function PageViewTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackEvent('page_view', { path: location });
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/collections/:slug" component={Collection} />
      <Route path="/products/:slug" component={Product} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/about" component={About} />
      <Route path="/lookbook" component={Journal} />
      <Route path="/contact" component={Contact} />
      
      <Route path="/faq"><PolicyPage type="faq" /></Route>
      <Route path="/shipping-returns"><PolicyPage type="shipping-returns" /></Route>
      <Route path="/privacy"><PolicyPage type="privacy" /></Route>
      <Route path="/terms"><PolicyPage type="terms" /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        <AuthProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <div className="text-foreground bg-background noise" />
              <PageViewTracker />
              <Router />
            </WouterRouter>
          </CartProvider>
        </AuthProvider>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

export default App;
