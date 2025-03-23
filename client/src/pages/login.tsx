import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/auth-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberUsername: z.boolean().optional().default(false),
  rememberPassword: z.boolean().optional().default(false),
  forgotCredentials: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Load saved username from localStorage if available
  const savedUsername = localStorage.getItem('rememberedUsername');
  const savedPassword = localStorage.getItem('rememberedPassword');
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: savedUsername || '',
      password: savedPassword || '',
      rememberUsername: !!savedUsername,
      rememberPassword: !!savedPassword,
      forgotCredentials: false,
    },
  });
  
  const { login } = useAuth();

  // Handle the checkbox change for "Forgot credentials"
  const handleForgotCredentialsChange = (checked: boolean) => {
    form.setValue("forgotCredentials", checked);
    if (checked) {
      setShowForgotDialog(true);
    }
  };
  
  // Handle the forgot credentials submission
  const handleForgotSubmit = () => {
    if (!forgotEmail) {
      toast({
        title: "Email required",
        description: "Please enter the email you used during registration.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Credentials recovery initiated",
      description: "If this email is registered, we'll send your username and password reset instructions to your email.",
    });
    
    setShowForgotDialog(false);
    form.setValue("forgotCredentials", false);
  };
  
  async function onSubmit(data: LoginFormValues) {
    // If the forgot credentials checkbox is checked, show the dialog
    if (data.forgotCredentials) {
      setShowForgotDialog(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Handle remember me functionality
      if (data.rememberUsername) {
        localStorage.setItem('rememberedUsername', data.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      if (data.rememberPassword) {
        localStorage.setItem('rememberedPassword', data.password);
      } else {
        localStorage.removeItem('rememberedPassword');
      }
      
      const success = await login(data.username, data.password);
      
      // Don't redirect here - the auth context will handle the redirect
      // based on whether this is a default admin account or not
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to handle input focus and adjust scroll position
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay the scroll to ensure keyboard is fully shown
    setTimeout(() => {
      // The element to scroll
      const scrollContainer = document.querySelector('.scroll-container');
      if (scrollContainer) {
        // Scroll to top to ensure form is visible above keyboard
        scrollContainer.scrollTop = 0;
        
        // Calculate how far to scroll based on input position
        const inputRect = e.target.getBoundingClientRect();
        const scrollTop = inputRect.top - 150; // Adjust 150px above the input
        
        // Scroll the container
        scrollContainer.scrollTop = scrollTop;
      }
    }, 300); // Small delay to ensure keyboard is visible
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-background p-4 scroll-container" style={{ paddingTop: '10vh', overflowY: 'auto', paddingBottom: '40vh' }}>
      <Card className="w-full max-w-md mb-60"> {/* Increased bottom margin to ensure room for keyboard */}
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the Observe and Report system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field} 
                        onFocus={handleInputFocus}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                        onFocus={handleInputFocus}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="rememberUsername"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Remember my username
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rememberPassword"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Remember my password
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="forgotCredentials"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={handleForgotCredentialsChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Email me my forgotten credentials
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Default credentials: admin / password123
          </p>
          <p className="text-xs text-muted-foreground text-center px-4">
            First-time users: After logging in with the admin account, you'll be prompted to create your own personal credentials for increased security.
          </p>
        </CardFooter>
      </Card>
      
      {/* Forgot Credentials Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={(open) => {
        setShowForgotDialog(open);
        if (!open) form.setValue("forgotCredentials", false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recover your credentials</DialogTitle>
            <DialogDescription>
              We can email your forgotten credentials to your registered email address.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="forgotEmail" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="your.email@example.com"
                className="w-full"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the email address you used during registration
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="default" 
              onClick={handleForgotSubmit}
            >
              Email my credentials
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowForgotDialog(false);
                form.setValue("forgotCredentials", false);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}