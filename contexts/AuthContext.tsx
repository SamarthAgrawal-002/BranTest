"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth, isFirebaseConfigured } from "@/lib/firebaseClient";
import type { User, SignupRequest, LoginRequest, UserRole } from "@/types";
import * as api from "@/lib/api";

// Helper to get dashboard route based on role
function getDashboardRoute(role: UserRole): string {
  return role === "agency" ? "/dashboard/agency" : "/dashboard/startup";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  signup: (data: SignupRequest) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for existing session on mount and listen to Firebase auth state
  useEffect(() => {
    // First, check localStorage for stored user (fast restore)
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_user");
        api.clearToken();
      }
    }
    
    // If Firebase is not configured, just use localStorage-based auth
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }
    
    const auth = getFirebaseClientAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }
    
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get fresh ID token for API calls
        const idToken = await firebaseUser.getIdToken();
        api.setToken(idToken);
      } else {
        // User signed out of Firebase
        if (user) {
          setUser(null);
          api.clearToken();
          localStorage.removeItem("auth_user");
        }
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      // Call backend to get custom token
      const response = await api.login(data);
      
      if (response.success && response.data) {
        // Sign in to Firebase with custom token (if configured)
        const auth = getFirebaseClientAuth();
        if (auth) {
          await signInWithCustomToken(auth, response.data.token);
          
          // Get ID token for API calls
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            api.setToken(idToken);
          }
        } else {
          // Fallback: use the custom token directly
          api.setToken(response.data.token);
        }
        
        setUser(response.data.user);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        setShowAuthModal(false);
        
        // Return redirect path based on role
        const redirectTo = getDashboardRoute(response.data.user.role);
        return { success: true, redirectTo };
      }
      
      return {
        success: false,
        error: response.error?.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    try {
      // Call backend to create user and get custom token
      const response = await api.signup(data);
      
      if (response.success && response.data) {
        // Sign in to Firebase with custom token (if configured)
        const auth = getFirebaseClientAuth();
        if (auth) {
          await signInWithCustomToken(auth, response.data.token);
          
          // Get ID token for API calls
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            api.setToken(idToken);
          }
        } else {
          // Fallback: use the custom token directly
          api.setToken(response.data.token);
        }
        
        setUser(response.data.user);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        setShowAuthModal(false);
        
        // Return redirect path based on role
        const redirectTo = getDashboardRoute(response.data.user.role);
        return { success: true, redirectTo };
      }
      
      return {
        success: false,
        error: response.error?.message || "Signup failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseClientAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch {
      // Ignore Firebase signout errors
    }
    setUser(null);
    api.clearToken();
    localStorage.removeItem("auth_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
