import { Switch, Route } from "wouter";
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
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";

function Router() {
  return (
    <>
      <Header />
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
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
