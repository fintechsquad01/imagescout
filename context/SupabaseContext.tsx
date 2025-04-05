
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { SupabaseClient } from '@supabase/supabase-js';

type SupabaseContextProps = {
  supabase: SupabaseClient | null;
  isLoading: boolean;
};

const SupabaseContext = createContext<SupabaseContextProps>({
  supabase: null,
  isLoading: true,
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    setSupabase(client);
    setIsLoading(false);
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
};
