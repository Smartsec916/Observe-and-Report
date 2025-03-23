import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthStatus();
  }, []);

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
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
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