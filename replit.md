# Property Management System

## Overview

This is a property management application designed to help manage landlords, tenants, properties, rental rate increases, and other aspects of property management. The application follows a modern stack with a React frontend and an Express backend, utilizing Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript
- **Routing**: Using Wouter for lightweight routing
- **State Management**: React Query for server state and React Context for application state
- **UI Components**: Uses shadcn/ui component library with Tailwind CSS for styling
- **Theming**: Supports both light and dark modes with CSS variables
- **Client Structure**: Organized into pages, components, hooks, and utilities

### Backend Architecture

- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints for property management operations
- **Database**: Drizzle ORM for database schema definition and queries
- **Authentication**: Session-based authentication (not fully implemented yet)

### Data Layer

- **Database**: PostgreSQL (using Drizzle as ORM)
- **Schema**: Defines tables for landlords, tenants, properties, and rental information
- **Data Access**: Server-side repository pattern for data operations

## Key Components

### Frontend Components

1. **Pages**:
   - Dashboard: Overview of properties, tenants, and reminders
   - Properties: CRUD operations for properties
   - Landlords: Management of property owners
   - Tenants: Management of tenants and leases
   - Rate Increases: Tracking and scheduling of rent increases
   - Birthdays: Tracking important dates for tenants and landlords
   - Settings: Application configuration

2. **UI Components**:
   - Extensive set of UI components based on shadcn/ui
   - Data table with pagination
   - Forms with validation
   - Dialog/modal components for operations
   - Toast notifications for user feedback

3. **State Management**:
   - React Query for server state management and caching
   - Context API for application-wide state like notifications

### Backend Components

1. **API Routes**:
   - Property endpoints (/api/properties)
   - Landlord endpoints 
   - Tenant endpoints
   - Rental rate increase endpoints
   - Birthday reminder endpoints

2. **Data Storage**:
   - Interface-based storage design for flexibility
   - PostgreSQL with Drizzle ORM for data persistence

## Data Flow

1. **User Interaction**:
   - User interacts with the UI (React components)
   - Actions trigger local state changes or API requests

2. **API Communication**:
   - Frontend makes requests to the backend API using React Query
   - API responses are cached and managed by React Query

3. **Backend Processing**:
   - Express routes handle API requests
   - Routes delegate to the storage layer for database operations
   - Validation of request data using Zod schemas

4. **Database Operations**:
   - Drizzle ORM handles database queries
   - Schema validation ensures data integrity

5. **Response Handling**:
   - Server sends JSON responses back to the client
   - Frontend updates UI based on response data

## External Dependencies

### Frontend Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS, clsx, cva for component variants
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulations
- **Charting**: Recharts for data visualization (included but not fully implemented)

### Backend Dependencies

- **Server**: Express
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL
- **Validation**: Zod for schema validation
- **Session Management**: connect-pg-simple for PostgreSQL session storage

## Deployment Strategy

The application is configured to run in a Replit environment with the following characteristics:

1. **Development Mode**: 
   - `npm run dev` runs both the frontend dev server and backend in watch mode
   - Uses Vite for frontend development with hot module replacement

2. **Production Build**:
   - Frontend: Vite builds static assets to dist/public
   - Backend: esbuild bundles server code to dist/index.js
   - Combined build process ensures proper asset paths and server configuration

3. **Database**:
   - PostgreSQL is configured through Replit's module system
   - Database schema migrations using Drizzle Kit

4. **Environment Variables**:
   - DATABASE_URL for database connection
   - NODE_ENV for environment detection

## Getting Started

1. Ensure PostgreSQL database is set up and DATABASE_URL is configured.
2. Run database migrations: `npm run db:push`
3. Start development server: `npm run dev`
4. To build for production: `npm run build`
5. To run production build: `npm run start`

## Next Steps

1. Complete the implementation of authentication and user management
2. Enhance reporting features for property management
3. Add file upload functionality for property documents
4. Implement document generation for leases and notices
5. Add more advanced filtering and search capabilities