# Observe and Report - Developer Documentation

This document provides technical details about the Observe and Report application's architecture, implementation details, and development guidelines.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: React Query for server state, React Context for global application state
- **Styling**: TailwindCSS with Shadcn UI components
- **Build Tools**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session with PostgreSQL store
- **File Handling**: Multer for file uploads
- **Security**: Field-level encryption for sensitive data

### Database
- **Type**: PostgreSQL
- **Schema**: Defined using Drizzle ORM with Zod validation
- **Migration**: Handled via Drizzle Kit's push mechanism

## Architecture Overview

The application follows a modern full-stack architecture with clear separation of concerns:

1. **Client Layer**: React application with component-based UI
2. **API Layer**: Express.js REST API endpoints
3. **Storage Layer**: Database abstraction through IStorage interface
4. **Database Layer**: PostgreSQL persistence with Drizzle ORM

### Data Flow

```
UI Component → API Request → Route Handler → Storage Interface → Database
                                                      ↑
Response ← Serialized Data ← Data Transformation ← Database Result
```

## Key Components

### Storage Interface (`server/storage.ts`)

The application implements the Repository pattern through the `IStorage` interface:

```typescript
export interface IStorage {
  getObservation(id: number): Promise<Observation | undefined>;
  getAllObservations(): Promise<Observation[]>;
  createObservation(observation: InsertObservation): Promise<Observation>;
  updateObservation(id: number, observation: Partial<InsertObservation>): Promise<Observation | undefined>;
  deleteObservation(id: number): Promise<boolean>;
  searchObservations(searchParams: SearchParams): Promise<Observation[]>;
  exportObservations(ids?: number[]): Promise<string>;
  importObservations(data: string): Promise<{ success: boolean; count: number; errors?: string[] }>;
}
```

The storage interface has two implementations:
- `MemStorage`: In-memory storage for development
- `DatabaseStorage`: PostgreSQL persistence for production

### Data Schema (`shared/schema.ts`)

The data model uses Drizzle ORM with Zod validation:

```typescript
// Observation schema for database
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  person: json("person").$type<z.infer<typeof personSchema>>(),
  vehicle: json("vehicle").$type<z.infer<typeof vehicleSchema>>(),
  location: json("location").$type<z.infer<typeof incidentLocationSchema>>(),
  notes: text("notes"),
  additionalNotes: json("additional_notes").$type<z.infer<typeof additionalNoteSchema>[]>(),
  images: json("images").$type<z.infer<typeof imageSchema>[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### API Routes (`server/routes.ts`)

The REST API endpoints are defined in the routes file:

```typescript
export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/login", ...);
  app.post("/api/logout", ...);
  app.get("/api/current-user", ...);
  
  // Observation CRUD operations
  app.get("/api/observations", ...);
  app.get("/api/observations/:id", ...);
  app.post("/api/observations", ...);
  app.patch("/api/observations/:id", ...);
  app.delete("/api/observations/:id", ...);
  
  // Search functionality
  app.post("/api/search", ...);
  
  // Image handling
  app.post("/api/upload", ...);
  app.delete("/api/images/:id", ...);
  
  // Data import/export
  app.post("/api/export", ...);
  app.post("/api/import", ...);
  
  return httpServer;
}
```

### Advanced Search Implementation

The search functionality implements a sophisticated scoring system that ranks results by relevance:

```typescript
// Score structure to track how well each observation matches search criteria
const matchScores = new Map<number, number>();

// Initialize all scores to 0
results.forEach(obs => {
  matchScores.set(obs.id, 0);
});

// Perform searches and increment scores for each match

// Sort results by match score (highest first)
if (matchScores.size > 0) {
  results.sort((a, b) => {
    const scoreA = matchScores.get(a.id) || 0;
    const scoreB = matchScores.get(b.id) || 0;
    
    // If scores are equal, sort by date (newest first)
    if (scoreB === scoreA) {
      // Handle potential null dates safely
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    
    return scoreB - scoreA;
  });
}
```

## Security Implementation

### Field-Level Encryption

Sensitive data is encrypted at the field level before storage:

```typescript
// Define the sensitive fields that should be encrypted
const SENSITIVE_FIELDS = [
  'person.name', 
  'person.description',
  'notes',
  'additionalNotes'
];

// Encrypt sensitive fields before storage
const encryptedData = encryptSensitiveFields(insertObservation, SENSITIVE_FIELDS);
```

The encryption uses AES-256 with a secure key derivation function.

### Authentication

The application uses Passport.js with a local strategy for authentication:

```typescript
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await storage.getUserByUsername(username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  }),
);
```

### Session Management

Sessions are stored in PostgreSQL for persistence across server restarts:

```typescript
const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
};
```

## Migration from Memory Storage to Database

The application initially used in-memory storage (`MemStorage`) and was later migrated to use PostgreSQL (`DatabaseStorage`). The `IStorage` interface ensured a smooth transition with no changes to the API layer.

## Performance Optimizations

### Image Handling

- Thumbnails are generated for the gallery view
- Images are loaded lazily in the UI
- Only 4 thumbnails are shown per search result with a count indicator

### Search Performance

- In-memory filtering is used for complex conditions
- Database queries handle basic filtering (dates, simple equality)
- Results are scored and sorted by relevance

### Caching Strategy

- React Query is used for client-side caching
- Invalidation is triggered on mutations
- Query keys are structured hierarchically for proper cache management

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow functional programming principles where appropriate
- Use async/await for asynchronous operations
- Always validate input data with Zod schemas

### Component Structure

- Keep components focused on a single responsibility
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Follow the container/presentation pattern for complex components

### Error Handling

- Use try/catch blocks for async operations
- Log errors server-side for debugging
- Return appropriate HTTP status codes
- Display user-friendly error messages in the UI

### Testing

- Write unit tests for utilities and critical business logic
- Use integration tests for API endpoints
- Implement end-to-end tests for critical user flows

## Deployment Considerations

### Environment Setup

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management
- `ENCRYPTION_KEY`: Key for field-level encryption (optional)

### Database Migration

When deploying to a new environment:

```bash
npm run db:push
```

This will create the necessary database tables.

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## Future Enhancements

- **Offline Support**: Implement service workers for offline capabilities
- **Real-time Sync**: Add WebSocket support for multi-device synchronization
- **Analytics Dashboard**: Create visualization for observation patterns
- **Advanced Filtering**: Implement more sophisticated search filters
- **Mobile App**: Package as a native mobile app using Capacitor
- **Push Notifications**: Add alert system for important events
- **Audit Logging**: Track all system and user actions for compliance
- **Report Generation**: Create PDF reports from observations

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check DATABASE_URL environment variable
   - Verify network connectivity to database server
   - Check database user permissions

2. **Image Upload Issues**
   - Verify uploads directory permissions
   - Check for disk space limitations
   - Validate file size and type restrictions

3. **Performance Problems**
   - Monitor database query performance
   - Check for N+1 query issues
   - Review client-side component re-rendering

### Logging

The application uses structured logging to assist with troubleshooting:

```typescript
log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
```

---

&copy; 2025 Observe and Report. All rights reserved.