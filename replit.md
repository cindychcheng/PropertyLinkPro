# Property Management System

## Overview

This is a comprehensive property management application with a secure authentication system designed to help manage landlords, tenants, properties, rental rate increases, and other aspects of property management. The application features role-based access control, Replit OAuth integration, and a complete user management interface. It follows a modern stack with a React frontend and an Express backend, utilizing Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication System

### Architecture Overview

The application implements a comprehensive 5-part authentication and authorization system:

1. **Replit OAuth Integration**: Uses OpenID Connect for secure user authentication
2. **Whitelist-Based Authorization**: Only explicitly added users can access the system
3. **Role-Based Access Control**: Four permission levels (Read-Only, Standard, Admin, Super Admin)
4. **Hybrid User Management**: System owner creates initial super admins, who then manage other users
5. **Built-in Admin Interface**: Complete user management dashboard for super administrators

### User Roles and Permissions

- **Read-Only**: View all data, cannot make changes
- **Standard**: Read access plus ability to edit properties, tenants, and landlords
- **Admin**: Standard permissions plus advanced features (audit logs, system settings)
- **Super Admin**: Complete access including user management and system administration

### Security Features

- Three-layer security: OAuth verification → whitelist check → role permissions
- Session-based authentication with PostgreSQL storage
- Automatic token refresh for seamless user experience
- Comprehensive audit logging for all user management actions
- Secure logout with proper session cleanup

### Database Schema

- `users`: Stores user profiles, roles, and status
- `sessions`: Secure session storage for authentication
- `user_audit_log`: Tracks all user management actions and system access

### Setup Process

1. Deploy application with database
2. Run initial user seed script to create first super admin
3. Super admin signs in and adds other users through the admin interface
4. Role-based access automatically enforced throughout the application

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

## Recent Changes

**January 21, 2025:**
- Fixed critical authentication flow issues with account linking between email registrations and Replit OAuth
- Resolved "server unavailable after login" errors through proper error handling and type safety
- Fixed account linking for users with mismatched emails between registration and OAuth providers
- Updated user management system to handle duplicate records and proper role assignment
- Ensured seamless authentication experience for approved users with proper session management
- Implemented email-based magic link authentication system for users without Replit accounts
- Added dual sign-in options (Replit OAuth + Email) on landing page for optimal user experience
- Created JWT-based secure authentication with automatic account linking capabilities
- Completed magic link authentication system with proper API routing and session management
- Fixed user ID consistency issues and validated full authentication flow for email users
- Implemented email notification system using Resend for admin alerts and user communications
- Added automatic notifications when users request access and when they get approved
- Created professional email templates with direct action links for efficient admin workflow

**June 16, 2025:**
- Enhanced search functionality with comprehensive co-tenant support
- Fixed birthday reminders to display "N/A" for landlords without residential addresses  
- Updated database schema to properly handle multiple active tenants per property
- Restored prominent search bar in header with keyboard shortcuts (Cmd/Ctrl+K)
- Implemented clickable search results that open specific property cards
- Added User Management interface with role-based access control
- Implemented registration system with super admin approval workflow
- Created `/register` page for user access requests with name and email
- Added "Request Access" button to landing page alongside sign-in option
- Replaced manual User ID entry with pending user approval system

**June 17, 2025:**
- Completed end-to-end email notification system for user onboarding workflow
- Fixed approval email notifications that weren't being sent when admins approve pending users
- Successfully debugged and resolved approval email routing issues
- Resolved email delivery issue by switching from unverified domain to Resend's verified domain
- Fixed "from" email address from 'notifications@property-management.app' to 'onboarding@resend.dev'
- Identified and resolved Resend free tier limitations (only sends to verified email addresses)
- Configured approval emails to route to admin's verified email with clear recipient labeling
- Validated complete user registration → admin notification → approval → user welcome email flow
- Confirmed Resend email service integration working correctly with proper domain verification
- Finalized production-ready email notification system with verified delivery to admin inbox
- Implemented Microsoft Azure Active Directory authentication integration
- Added three-method authentication: Microsoft OAuth, Replit OAuth, and email magic links
- Configured Azure AD with MSAL integration for seamless staff sign-in
- Successfully resolved Azure redirect URI configuration and client secret issues
- Fixed Vite middleware routing conflict that was preventing Azure callback completion
- Resolved email case mismatch between Microsoft OAuth response and database records
- Fixed session initialization order to ensure Azure auth routes have proper session middleware
- Completed fully functional Microsoft authentication system with proper session management
- Successfully tested and verified Microsoft sign-in working for CindyCheng@cindychcheng.onmicrosoft.com
- System now supports three authentication methods: Microsoft OAuth, Replit OAuth, and email magic links
- Implemented case-insensitive email lookup system to prevent authentication failures
- Fixed session conflicts by adding automatic logout before Microsoft authentication
- Upgraded Microsoft account (cindycheng@cindychcheng.onmicrosoft.com) to super admin privileges
- Enhanced Microsoft sign-in button with cookie clearing and forced redirect for reliable authentication
- Created simple username/password authentication system for immediate admin access
- Enhanced security by migrating admin credentials from hardcoded values to environment variables
- Implemented mobile-responsive sidebar with hamburger menu for optimal mobile user experience
- Added collapsible navigation that works seamlessly across desktop and mobile devices
- Improved header layout for mobile devices with appropriate spacing and branding
- Secured admin authentication with ADMIN_USERNAME and ADMIN_PASSWORD environment variables
- Conducted comprehensive security audit and fixed password hash exposure vulnerabilities
- Removed password fields from all API responses to prevent credential leakage
- Eliminated hardcoded credential fallbacks and strengthened environment variable validation
- Verified complete protection against unauthorized access to admin credentials

**June 18, 2025:**
- Successfully resolved search functionality critical bug after extensive debugging
- Identified that wrong search component was being debugged (SimpleSearch vs SearchBar)
- Fixed URL parameter mismatch between search navigation and properties page detection
- Search was using `address` parameter while properties page looked for `property` parameter
- Updated properties page to accept both `address` and `property` URL parameters
- Resolved intermittent property dialog opening issues with custom event system
- Implemented reliable custom event communication between search and properties components
- Added 100ms delay to ensure navigation completes before dialog opens
- Search functionality now consistently opens property dialogs on every click
- Validated complete search workflow: search → results → click → immediate property dialog
- Confirmed search works for property addresses, landlord names, and tenant names
- Fixed mobile header layout overlap between hamburger menu and "Property Management" heading
- Repositioned header elements with proper spacing to maintain intuitive left-side hamburger menu placement

## Next Steps

1. Complete the implementation of authentication and user management
2. Enhance reporting features for property management
3. Add file upload functionality for property documents
4. Implement document generation for leases and notices
5. Add more advanced filtering and search capabilities