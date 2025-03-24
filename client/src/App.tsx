import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home";
import InputPage from "@/pages/input";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import CreateAccountPage from "@/pages/create-account";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

function Router() {
  const [location] = useLocation();
  const showBottomNav = !["/login"].includes(location);

  return (
    <>
      <Header />
      <div className={showBottomNav ? "pb-16" : ""}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/create-account">
            {() => (
              <ProtectedRoute>
                <CreateAccountPage />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/">
            {() => (
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/search">
            {() => (
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/input">
            {() => (
              <ProtectedRoute>
                <InputPage />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/input/:id">
            {({ id }) => (
              <ProtectedRoute>
                <InputPage id={id} />
              </ProtectedRoute>
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
