import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/api-client';

interface WishlistContextType {
  items: string[]; // store slugs
  addItem: (slug: string) => void;
  removeItem: (slug: string) => void;
  hasItem: (slug: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lwk_wishlist');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const addItem = (slug: string) => {
    setItems((prev) => {
      if (prev.includes(slug)) return prev;
      const next = [...prev, slug];
      localStorage.setItem('lwk_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (slug: string) => {
    setItems((prev) => {
      const next = prev.filter((s) => s !== slug);
      localStorage.setItem('lwk_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const hasItem = (slug: string) => items.includes(slug);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, hasItem }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
