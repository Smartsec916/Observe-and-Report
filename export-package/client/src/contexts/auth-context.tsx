import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
  isDefault?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const data = await apiRequest('/api/current-user', {
          method: 'GET',
          on401: 'returnNull',
        });
        
        if (data?.user) {
          setUser(data.user);
          setRequiresSetup(data.requiresSetup === true);
          
          // Redirect to create account page if first-time login with default admin
          if (data.requiresSetup) {
            setLocation('/create-account');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthStatus();
  }, [setLocation]);

  // Login function
  async function login(username: string, password: string): Promise<boolean> {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      if (response?.success && response?.user) {
        setUser(response.user);
        
        // After login, fetch current user to check if this is a default admin
        const userData = await apiRequest('/api/current-user', {
          method: 'GET',
          on401: 'returnNull',
        });
        
        const isDefaultAdmin = userData?.requiresSetup === true;
        setRequiresSetup(isDefaultAdmin);
        
        toast({
          title: "Login successful",
          description: isDefaultAdmin 
            ? "Please create your personal credentials" 
            : "Welcome back!",
        });
        
        // Redirect based on user type
        if (isDefaultAdmin) {
          setLocation('/create-account');
        } else {
          // For regular users, redirect to home page
          setLocation('/');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials or server error",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Logout function
  async function logout() {
    try {
      await apiRequest('/api/logout', {
        method: 'POST',
      });
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    requiresSetup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}