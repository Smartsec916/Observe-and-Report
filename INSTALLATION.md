# Observe and Report - Installation Guide

This guide provides step-by-step instructions for setting up and running the Observe and Report application in different environments.

## Local Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm (usually comes with Node.js)
- PostgreSQL database (version 12 or higher)

### Step 1: Clone the Repository

```bash
git clone [repository-url]
cd observe-and-report
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/observe_report_db
SESSION_SECRET=your_secure_session_secret
```

Replace the `DATABASE_URL` with your actual PostgreSQL connection string.

### Step 4: Initialize the Database

First, create a PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE observe_report_db;
\q
```

Then, push the schema to the database:

```bash
npm run db:push
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5000`.

## Production Deployment

### Option 1: Traditional Server Deployment

#### Prerequisites

- Node.js (version 18 or higher)
- npm
- PostgreSQL database
- Web server (e.g., Nginx, Apache) for reverse proxy (optional)

#### Steps

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd observe-and-report
   ```

2. Install production dependencies:
   ```bash
   npm ci --production
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Set up environment variables (similar to development setup).

5. Initialize the database:
   ```bash
   npm run db:push
   ```

6. Start the production server:
   ```bash
   npm start
   ```

### Option 2: Docker Deployment

#### Prerequisites

- Docker
- Docker Compose (optional, for multi-container setup)

#### Using Docker Compose

1. Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/observe_report_db
      - SESSION_SECRET=your_secure_session_secret
    depends_on:
      - db
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=observe_report_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. Start the containers:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:5000`.

### Option 3: Cloud Platform Deployment

#### Heroku

1. Create a new Heroku app:
```bash
heroku create observe-and-report
```

2. Add PostgreSQL add-on:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. Set environment variables:
```bash
heroku config:set SESSION_SECRET=your_secure_session_secret
```

4. Deploy the application:
```bash
git push heroku main
```

5. Run database migrations:
```bash
heroku run npm run db:push
```

#### Render

1. Create a new Web Service on Render, connected to your repository.
2. Set up a PostgreSQL database in the Render dashboard.
3. Configure environment variables:
   - `DATABASE_URL`: Provided by Render PostgreSQL service
   - `SESSION_SECRET`: Your secure session secret
4. Set the build command to `npm install && npm run build`.
5. Set the start command to `npm start`.

## Mobile Application Packaging

### Using Capacitor (Recommended)

1. Install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init
```

2. Build the web application:
```bash
npm run build
```

3. Add platforms:
```bash
npx cap add android
npx cap add ios
```

4. Copy the web assets:
```bash
npx cap copy
```

5. Open native IDE:
```bash
npx cap open android
npx cap open ios
```

6. Build and deploy using the native IDE.

## Troubleshooting

### Common Installation Issues

1. **Node.js Version Incompatibility**
   - Use NVM (Node Version Manager) to install the correct Node.js version.
   - Run `nvm install 18` and `nvm use 18`.

2. **PostgreSQL Connection Issues**
   - Verify that PostgreSQL is running: `pg_isready`.
   - Check credentials and database existence.
   - Make sure the PostgreSQL user has appropriate permissions.

3. **Port Conflicts**
   - If port 5000 is already in use, you can modify the port in `server/index.ts`.
   - Alternatively, you can set the `PORT` environment variable.

4. **Build Failures**
   - Clear the cache: `npm cache clean --force`.
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`.

### Getting Help

If you encounter issues not covered in this guide, please:
1. Check the existing GitHub issues
2. Consult the DEVELOPER.md file for technical details
3. Contact the development team for support

## System Requirements

### Minimum Requirements

- **Server**:
  - CPU: 2 cores
  - RAM: 2GB
  - Storage: 1GB for the application + storage for uploaded images

- **Database**:
  - PostgreSQL 12+
  - Storage: Depends on usage (approximately 5MB per 1000 observations without images)

- **Client Browser**:
  - Chrome 80+, Firefox 72+, Safari 13+, Edge 80+
  - Mobile: iOS Safari, Android Chrome

### Recommended Requirements

- **Server**:
  - CPU: 4 cores
  - RAM: 4GB
  - Storage: SSD with at least 10GB free space

- **Database**:
  - PostgreSQL 14+
  - Storage: 50GB+ for high-usage scenarios

- **Client Device**:
  - Samsung S24 Ultra (optimized experience)
  - Any modern smartphone with camera capabilities

## License and Legal

This software is proprietary and confidential. Usage, installation, and distribution are subject to the terms of the license agreement.

---

&copy; 2025 Observe and Report. All rights reserved.