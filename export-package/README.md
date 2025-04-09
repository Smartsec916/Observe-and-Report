# Observe and Report

A mobile-first observation logging platform designed for security professionals to efficiently document incidents, track subjects, and maintain detailed records through a structured "What, Where, and When" framework.

![Observe and Report Logo](./public/favicon.ico)

## Overview

Observe and Report is a comprehensive mobile-optimized application tailored specifically for the Samsung S24 Ultra, though it works well on all modern mobile devices. It enables security professionals to document comprehensive data about individuals, vehicles, and events with robust location tracking, timestamp recording, and image attachment capabilities.

## Key Features

- **Mobile-First Design**: Optimized for Samsung S24 Ultra with responsive layout
- **Comprehensive Documentation**: Record detailed information about subjects and vehicles
- **Advanced Search**: Sophisticated scoring system that ranks results by relevance
- **Image Management**: Upload, categorize, and manage multiple images per observation
- **Location Tracking**: Map integration with OpenStreetMap and Google Maps support
- **Data Security**: End-to-end encryption for sensitive information
- **Responsive Interface**: Professional UI with dark mode support
- **Persistent Storage**: PostgreSQL database for reliable data storage
- **Export/Import**: Share and backup observation data

## Technology Stack

- **Frontend**: React with TypeScript, TailwindCSS, and Shadcn UI components
- **Backend**: Express.js with modular routing
- **Database**: PostgreSQL with Drizzle ORM
- **Maps**: Leaflet.js with OpenStreetMap
- **Image Processing**: Advanced image metadata extraction
- **Authentication**: Secure user authentication and access control

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd observe-and-report
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/observe_report_db
   SESSION_SECRET=your_secure_session_secret
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

## Usage Guide

### Logging Observations

1. Navigate to the "Input" page from the bottom navigation
2. Fill in details about the person, vehicle, and location
3. Upload images with the camera or from gallery
4. Add notes and save the observation

### Searching Records

1. Go to the "Search" page
2. Enter search terms or filter criteria
3. Review results ranked by relevance
4. Click on any result to view full details

### Exporting Data

1. Navigate to the "Data Management" page
2. Select observations to export or choose "Export All"
3. Download the export file for backup or sharing

## Features in Detail

### Person Information
- Name (first, middle, last)
- Physical description (height, build, hair color, etc.)
- Age range and identifying features
- Contact information (if available)

### Vehicle Information
- Make, model, and year range
- Color and identifying features
- License plate with separate character inputs
- Additional notes

### Location Tracking
- Automatic GPS coordinates from image metadata
- Manual location entry and adjustment
- Map visualization and navigation options

### Image Management
- Multiple image support per observation
- Automatic metadata extraction
- Image descriptions and categorization
- Thumbnail generation and gallery view

### Security Features
- Field-level encryption for sensitive data
- Authentication and authorization controls
- Secure session management
- Data validation and sanitization

## Data Model

The application uses a sophisticated data model to represent observations:

- **Observations**: The core entity containing all information about an incident
- **Person**: Structured information about individuals
- **Vehicle**: Details about vehicles, including license plate information
- **Location**: Geographic coordinates and address information
- **Images**: Photo evidence with metadata and descriptions
- **Notes**: Additional textual information about the observation

## Development

### Project Structure

```
├── client/            # Frontend React application
├── server/            # Backend Express.js server
├── shared/            # Shared types and schemas
├── public/            # Static assets and uploads
└── types/             # TypeScript type definitions
```

### Key Files

- `shared/schema.ts`: Data models and validation schemas
- `server/storage.ts`: Database access and CRUD operations
- `server/routes.ts`: API endpoints and request handling
- `client/src/pages/`: React components for different views
- `client/src/components/`: Reusable UI components

### Build and Deployment

For production deployment:

```bash
npm run build
npm start
```

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Support

For support and feature requests, please contact the development team.

---

&copy; 2025 Observe and Report. All rights reserved.