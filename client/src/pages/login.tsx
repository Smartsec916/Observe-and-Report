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
      title: "Recovery email sent",
      description: "If this email is registered in our system, you will receive instructions to recover your credentials.",
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
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
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
                      <Input placeholder="Enter your username" {...field} />
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
                      <Input type="password" placeholder="Enter your password" {...field} />
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
                          Forgot my username or password
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
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recover your credentials</DialogTitle>
            <DialogDescription>
              Enter the email address you used during registration. We'll send you instructions to recover your username and/or reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <FormLabel htmlFor="forgotEmail">Email</FormLabel>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="your.email@example.com"
                className="w-full"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="default" 
              onClick={handleForgotSubmit}
            >
              Recover credentials
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