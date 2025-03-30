import { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

// In-memory user store (in production, this would be a database)
const users = new Map<string, { id: string; username: string; password: string; isDefault?: boolean }>();

// Add a default admin user
users.set("admin", { 
  id: "1", 
  username: "admin", 
  password: "password123", // In production, this would be hashed
  isDefault: true
});

// Configure passport to use local strategy
passport.use(new LocalStrategy(
  (username, password, done) => {
    const user = users.get(username);
    
    if (!user) {
      return done(null, false, { message: "Invalid username" });
    }
    
    if (user.password !== password) { // In production, we would use password comparison
      return done(null, false, { message: "Invalid password" });
    }
    
    return done(null, user);
  }
));

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  // Find the user by id in our user store
  for (const [_, user] of users.entries()) {
    if (user.id === id) {
      return done(null, user);
    }
  }
  
  done(new Error("User not found"), null);
});

// Configure session store
const MemorySessionStore = MemoryStore(session);

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: "Unauthorized: Authentication required" });
}

// Setup authentication middleware
export function setupAuth(app: any) {
  // Session configuration
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 1 day
      store: new MemorySessionStore({
        checkPeriod: 86400000 // Cleanup expired sessions every day
      }),
      secret: process.env.SESSION_SECRET || "observereport-secret-key",
      resave: false,
      saveUninitialized: false
    })
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Authentication routes
  app.post("/api/login", passport.authenticate("local"), (req: Request, res: Response) => {
    res.json({ success: true, user: req.user });
  });
  
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  
  app.get("/api/current-user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        user,
        requiresSetup: user?.isDefault === true
      });
    } else {
      res.json({ user: null });
    }
  });
  
  // Create a new user account
  app.post("/api/create-account", isAuthenticated, (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Basic validation
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Check if username already exists
      if (users.has(username)) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create new user
      const newUser = addUser(username, password);
      
      res.json({ success: true, user: newUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to create account" });
    }
  });
}

// Function to add a new user
export function addUser(username: string, password: string) {
  const id = (users.size + 1).toString();
  users.set(username, { id, username, password });
  return { id, username };
}

// Function to check if we need to perform initial admin setup
export function isInitialSetupNeeded(): boolean {
  // Check if we only have the default admin user
  return users.size === 1 && users.has('admin');
}