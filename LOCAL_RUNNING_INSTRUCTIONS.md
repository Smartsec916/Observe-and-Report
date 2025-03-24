# Running the Observation App Locally

This guide provides instructions for running the Observation App locally after downloading it from Replit.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Setup Instructions

1. **Clone or download the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install cross-env package**
   ```bash
   npm install cross-env --save-dev
   ```

4. **Modify package.json**
   
   Update the `start` script in your package.json to use cross-env:
   
   From:
   ```json
   "start": "NODE_ENV=production node dist/index.js"
   ```
   
   To:
   ```json
   "start": "cross-env NODE_ENV=production node dist/index.js"
   ```
   
   This ensures compatibility across different operating systems, especially Windows.

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   npm start
   ```

## Development Mode

To run the application in development mode:

```bash
npm run dev
```

## Troubleshooting

### Common Issues

#### "NODE_ENV not recognized" on Windows

If you see an error related to NODE_ENV not being recognized on Windows, make sure you've installed cross-env and updated your start script as mentioned above.

#### Port Already in Use

If port 5000 is already in use, you can modify the port in server/index.ts:

```typescript
const PORT = process.env.PORT || 5001; // Change to an available port
```

#### Missing Permissions for Image Storage

The application requires write permissions to store uploaded images. Ensure the uploads directory has the proper permissions.

## Mobile Access

To access the app from a mobile device while running locally:

1. Ensure your computer and mobile device are on the same network
2. Find your computer's local IP address (typically starts with 192.168...)
3. Access the app from your mobile device using: http://[your-computer-ip]:5000

## Production Deployment

For production deployment, consider:

1. Setting up proper environment variables
2. Configuring a reverse proxy (like Nginx)
3. Implementing HTTPS for secure connections

## Additional Resources

For more information about the application architecture and features, please refer to the documentation in the `/docs` directory.