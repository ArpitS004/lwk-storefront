import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { CartProvider } from './lib/cart';
import { WishlistProvider } from './lib/wishlist';

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

function Router() {
  return (
    <Switch>
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
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <div className="text-foreground bg-background noise" />
            <Router />
          </WouterRouter>
        </CartProvider>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

export default App;
