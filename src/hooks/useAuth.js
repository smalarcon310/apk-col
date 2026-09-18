import { useEffect, useState } from 'react';
import { sessionUser } from '../services/mysqlApi';

export const useAuth = () => {
  const [user, setUser] = useState(sessionUser());
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);

  useEffect(() => {
    const sync = () => setUser(sessionUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return { user, userData: user, loading, error };
};
