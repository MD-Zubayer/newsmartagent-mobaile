import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, clearAuthToken, isLoggedIn } from '../lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // অ্যাপ চালু হওয়ার সময় চেক করবে ইউজার লগইন করা আছে কি না
    const loadStorageData = async () => {
      try {
        const authenticated = await isLoggedIn();
        if (authenticated) {
          // এখানে চাইলে আপনি এপিআই কল করে ইউজারের প্রোফাইল ডাটা নিতে পারেন
          setUser({ loggedIn: true }); 
        }
      } catch (e) {
        console.error("Failed to load auth state", e);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const logout = async () => {
    await clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};