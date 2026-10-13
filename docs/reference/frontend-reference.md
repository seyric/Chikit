# Chikit by Solar - Frontend Reference

This document provides a comprehensive reference of the Chikit frontend application built with React, Vite, TypeScript, and Tailwind CSS. The frontend is a single-page application (SPA) that communicates with the Chikit backend API via a generated API client.

## Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom configurations
- **State Management**: React Query (TanStack Query) for server state, React Context for auth state
- **Routing**: Wouter (lightweight router)
- **UI Components**: Radix UI primitives with custom styling
- **Data Visualization**: Recharts for charts and graphs
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: Sonner toast notifications
- **API Client**: Generated from OpenAPI specification (@workspace/api-client-react)

## Project Structure
```
artifacts/chikit/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   ├── index.css          # Global CSS styles
│   ├── components/        # Reusable UI components
│   │   ├── layout.tsx     # Main application layout
│   │   └── ui/            # Radix UI-based components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and auth logic
│   ├── pages/             # Page components (views)
│   └── ...                # Other supporting files
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

## Core Architecture

### Application Entry Point
**File**: `src/main.tsx`
The application entry point sets up the React root and renders the App component.

### Main Application Component
**File**: `src/App.tsx`
The App component orchestrates:
- React Query provider for server state management
- Auth provider for authentication state
- Tooltip and Toaster providers for UI enhancements
- Wouter router for client-side routing
- Route definitions for all application pages

### Authentication System
**File**: `src/lib/auth.tsx`
The authentication system uses React Context to manage user state and includes:
- Automatic JWT token injection into fetch requests
- Token validation and refresh handling
- Login/logout functions with localStorage persistence
- Portal type selection (staff/patient)
- Hospital selection context

### Layout System
**File**: `src/components/layout.tsx`
The layout component provides:
- Responsive sidebar navigation with role-based menu items
- Top header with user info and role badges
- Main content area with consistent spacing
- Role-based navigation menus showing relevant pages for each user type
- Persistent state for selected hospital and portal type

## State Management

### Server State (React Query)
React Query is used throughout the application for:
- Fetching, caching, and synchronizing server state
- Automatic refetching and background updates
- Pagination and infinite query support
- Mutation handling for create/update/delete operations
- Optimistic updates where appropriate

Example usage from dashboard:
```typescript
const { data: stats, isLoading } = useGetDashboardStats();
```

### Client State (React Context)
React Context manages:
- Authentication state (user data, loading status)
- Portal type selection (staff vs patient interface)
- Selected hospital context for multi-tenant filtering

## Routing System
**Library**: Wouter (https://github.com/molefrog/wouter)

Routes are defined in `App.tsx` with:
- Public routes: `/login`, `/register`
- Protected routes requiring authentication (wrapped in ProtectedRoute component)
- Standalone patient portal: `/patient-portal` and subpaths
- Role-specific pages based on user permissions
- 404 handling with NotFound component

The ProtectedRoute component:
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading spinner while validating token
- Renders requested component within Layout when authenticated

## Component Architecture

### UI Components Library
The application uses Radix UI primitives accessed through `src/components/ui/`:
- All components follow Radix's accessibility-first approach
- Custom styling applied via Tailwind CSS classes
- Consistent API across components (children, variants, states)
- Comprehensive set including: buttons, forms, dialogs, menus, tables, etc.

### Layout Components
**File**: `src/components/layout.tsx`
- Sidebar navigation with collapsible sections
- Role-based menu item generation
- Header with user information and badges
- Responsive design for mobile and desktop

### Page Components
Located in `src/pages/`, each represents a distinct view:
- **Dashboard**: Overview statistics and insights
- **Patients**: Patient list and registration
- **Patient Detail**: Detailed patient information
- **Appointments**: Scheduling and management
- **AI Assistant**: Symptom analysis and medical AI features
- **Hospital Directory**: Hospital browsing and management
- **Role-specific pages**: Receptionist, Labs, Radiology, Pharmacy, Ward, etc.
- **Management pages**: Staff management, drug database, reports, billing

Each page typically:
- Uses React Query hooks for data fetching
- Implements loading and error states
- Provides interactive UI for data manipulation
- Uses form validation for data entry
- Implements role-based access control at UI level

## Hooks

### Custom Hooks
**File**: `src/hooks/`
- `use-mobile.tsx`: Detects mobile device characteristics for responsive behavior
- `use-toast.ts`: Wrapper around Sonner for consistent toast notifications

### API Hooks
Generated by the API client in `@workspace/api-client-react`:
- Automatically generated React Query hooks for each API endpoint
- Follow naming convention: `useGet{Resource}`, `useCreate{Resource}`, etc.
- Provide data, isLoading, isError, and mutate functions
- Automatically handle token authentication via intercepted fetch

Example from dashboard:
```typescript
import { useGetDashboardStats } from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  // ...
}
```

## Utilities

### Utility Functions
**File**: `src/lib/utils.ts`
- `cn()`: Class name utility for conditional Tailwind classes (similar to clsx)
- Other helper functions for formatting, validation, etc.

### Auth Interceptor
**File**: `src/lib/auth.tsx` (lines 8-19)
- Intercepts global fetch to automatically attach JWT tokens
- Reads token from localStorage and adds to Authorization header
- Ensures all API requests are authenticated without manual header setting

## Styling System

### Tailwind CSS
**Configuration**: `tailwind.config.js`
- Custom color palette extending default Tailwind colors
- Responsive breakpoints tailored to application needs
- Custom utilities for application-specific styles
- Dark mode support via class strategy

### Global Styles
**File**: `src/index.css`
- Base styles and CSS resets
- Tailwind base, components, and utilities directives
- Custom CSS variables for theming
- Smooth transitions and animations

### Component Styling Approach
- Utility-first Tailwind CSS classes
- Component variants using class-variance-authority
- Consistent spacing and typography scales
- Responsive design with mobile-first approach
- Dark/light mode support through CSS variables

## Data Visualization
**Library**: Recharts
Used in dashboard and reports pages for:
- Statistical charts and graphs
- Trend visualization
- Data comparison views
- Interactive tooltips and legends

## Forms and Validation
**Libraries**: React Hook Form + Zod
- Form state management and validation
- Schema-based validation with Zod
- Error message display and field highlighting
- Optimistic updates where appropriate
- Reset and clearing functionality

## Internationalization (i18n)
Currently not implemented - all text is hardcoded in English.
Future implementation would likely use:
- React Context for language selection
- JSON files for translations
- React-i18next or similar library

## Accessibility Features
- Semantic HTML elements throughout
- ARIA attributes via Radix UI components
- Keyboard navigation support
- Focus management in modals and dialogs
- Sufficient color contrast ratios
- Screen reader friendly labels and descriptions

## Performance Optimizations
- Code splitting via dynamic imports (React.lazy where used)
- Efficient React Query caching and deduplication
- Memoization of expensive computations
- Virtual scrolling for large lists (where implemented)
- Optimized image loading and asset delivery
- Minimal CSS and JavaScript bundle sizes

## Error Handling
- Global error boundaries for unexpected errors
- API error handling through React Query's isError state
- User-friendly error messages and recovery options
- Logging to console for development debugging
- Graceful degradation when features fail

## Security Features
- Automatic JWT token handling via fetch interceptor
- Protected routes preventing unauthorized access
- Role-based UI rendering (hiding inaccessible features)
- Input sanitization and validation
- Protection against common XSS vectors through proper escaping
- Secure headers configured in backend (affects API responses)

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Responsive design for various screen sizes
- Progressive enhancement where possible

## Development Experience
- Fast refresh with Vite during development
- TypeScript strict mode for type safety
- ESLint and Prettier configured (inferred from setup)
- Clear component organization and naming conventions
- Comprehensive prop typing with TypeScript interfaces
- JSDoc comments where beneficial

## Build and Deployment
**Scripts** (from package.json):
- `dev`: Start development server with Vite
- `build`: Create production build
- `serve`: Preview production build locally
- `typecheck`: Run TypeScript type checking

Production build outputs to `dist/` directory with:
- Minified JavaScript and CSS assets
- Optimized bundling and code splitting
- Cache-busting filenames
- HTML entry point with asset references

## API Integration
The frontend communicates with the backend through:
1. **Generated API Client** (`@workspace/api-client-react`):
   - Type-safe API calls with TypeScript definitions
   - Automatic request/response serialization
   - React Query hooks for data fetching and mutations
   - Error handling and retry mechanisms

2. **Fetch Interceptor**:
   - Automatically attaches authentication tokens
   - Handles token refresh logic (if implemented)
   - Provides consistent error handling

3. **React Query**:
   - Manages request/response caching
   - Provides loading, error, and success states
   - Enables optimistic updates
   - Handles background refetching

Example API call pattern:
```typescript
import { useGetPatients, useCreatePatient } from "@workspace/api-client-react";

function PatientsPage() {
  const { data: patients, isLoading } = useGetPatients();
  const { mutate: createPatient, isPending } = useCreatePatient({
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });
  
  // Use in JSX
  return (
    <div>
      {isLoading ? <LoadingSpinner /> : <PatientList patients={patients} />}
      <button onClick={() => createPatient(patientData)}>
        Register Patient
      </button>
    </div>
  );
}
```

## Testing Approach
While not explicitly shown in the codebase, testing would typically include:
- Unit tests for utility functions and hooks
- Component tests with React Testing Library
- End-to-end tests with Cypress or Playwright
- Visual regression testing for UI components
- API contract testing

## Environment Variables
Loaded via Vite's import.meta.env:
- `import.meta.env.BASE_URL`: Base URL for routing
- `import.meta.env.MODE`: Development/production mode
- Custom variables prefixed with `VITE_` for client-side access

## Future Enhancement Areas
1. **State Migration**: Consider migrating to a more granular state management solution (Zustand, Jotai) for complex client state
2. **Testing**: Implement comprehensive test suite
3. **Internationalization**: Add i18n support for multi-language deployment
4. **Performance**: Implement virtual scrolling for large datasets, improve bundle analysis
5. **Accessibility**: Conduct formal accessibility audits and implement fixes
6. **Documentation**: Add Storybook for component documentation and testing
7. **Error Tracking**: Integrate with error monitoring services (Sentry, etc.)
8. **Feature Flags**: Implement feature flag system for gradual rollouts
9. **Offline Support**: Add service worker and offline capabilities for progressive web app
10. **Theming**: Enhance theming capabilities with multiple color schemes

## Component Reference

### Layout Components
- **Layout**: Main application layout with sidebar, header, and content area
- **ProtectedRoute**: Wrapper component that enforces authentication

### UI Components (src/components/ui/)
All components from Radix UI primitives with custom styling:
- Button variants: default, destructive, outline, secondary, ghost
- Form elements: input, textarea, select, checkbox, radio, slider
- Feedback elements: alert, badge, progress, skeleton, spinner
- Overlay elements: dialog, popover, tooltip, dropdown-menu, context-menu
- Navigation elements: breadcrumb, pagination, tabs, menubar, navigation-menu
- Data display: accordion, collapsible, carousel, chart, table, tabs
- Interactive: command, draggable, resizable, scroll-area, separator, toggle, toggle-group

### Page Components (src/pages/)
- **Authentication**: Login.tsx, Register.tsx
- **Patient Management**: Patients.tsx, PatientDetail.tsx, RegisterPatient.tsx
- **Clinical**: Appointments.tsx, Labs.tsx, Radiology.tsx, Pharmacy.tsx, Ward.tsx
- **Management**: Dashboard.tsx, StaffManagement.tsx, DrugDatabase.tsx, Reports.tsx, Billing.tsx
- **Special Features**: AiAssistant.tsx, HospitalDirectory.tsx, Receptionist.tsx
- **Patient Portal**: PatientPortal.tsx (standalone layout)
- **Error Handling**: NotFound.tsx

### Custom Hooks
- **use-mobile.ts**: Device detection for responsive behavior
- **use-toast.ts**: Notification wrapper

### Libraries
- **Auth**: Custom implementation in src/lib/auth.tsx
- **Routing**: Wouter (imported from "wouter")
- **State**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form (@hookform/resolvers) with Zod
- **UI**: Radix UI (@radix-ui/react-*) + Lucide React (icons)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Date Handling**: date-fns
- **API Client**: @workspace/api-client-react (generated)

---
*This frontend reference is generated from the actual codebase and represents the current state of the Chikit frontend application. For the most up-to-date information, always refer to the source code and run the application locally to verify component behavior and API integration.*