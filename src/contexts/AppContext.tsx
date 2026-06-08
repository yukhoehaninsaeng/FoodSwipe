'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Restaurant } from '@/data/restaurants';

interface AppContextType {
  wishlist: Restaurant[];
  addToWishlist: (r: Restaurant) => void;
  removeFromWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  notifNewOpen: boolean;
  setNotifNewOpen: (v: boolean) => void;
  notifGroupMatch: boolean;
  setNotifGroupMatch: (v: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  wishlist: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isWishlisted: () => false,
  notifNewOpen: true,
  setNotifNewOpen: () => {},
  notifGroupMatch: true,
  setNotifGroupMatch: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Restaurant[]>([]);
  const [notifNewOpen, setNotifNewOpen] = useState(true);
  const [notifGroupMatch, setNotifGroupMatch] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fs-wishlist');
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  const addToWishlist = (r: Restaurant) => {
    setWishlist(prev => {
      if (prev.find(x => x.id === r.id)) return prev;
      const next = [r, ...prev];
      localStorage.setItem('fs-wishlist', JSON.stringify(next));
      return next;
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem('fs-wishlist', JSON.stringify(next));
      return next;
    });
  };

  const isWishlisted = (id: string) => wishlist.some(x => x.id === id);

  return (
    <AppContext.Provider value={{
      wishlist, addToWishlist, removeFromWishlist, isWishlisted,
      notifNewOpen, setNotifNewOpen,
      notifGroupMatch, setNotifGroupMatch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
