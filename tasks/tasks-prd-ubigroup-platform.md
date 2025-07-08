## Relevant Files

- `prisma/schema.prisma` - Defines all database models: `User`, `Role`, `Agency`, `Property`, and their relations.
- `src/app/api/properties/route.ts` - API for creating, reading, updating, and deleting properties.
- `src/app/api/agencies/route.ts` - API for Super Admin to manage agencies.
- `src/app/api/agents/route.ts` - API for Agency Admins to manage agents.
- `src/middleware.ts` - To protect routes and implement role-based access control.
- `src/lib/prisma.ts` - Prisma client instance.
- `src/lib/validations/` - Zod schemas for validating request bodies for properties, users, etc.
- `src/app/(dashboard)/layout.tsx` - Main layout for the entire administrative dashboard.
- `src/app/(dashboard)/dashboard/page.tsx` - The main landing page for each role's dashboard.
- `src/components/dashboard/property-form.tsx` - Component for creating and editing property listings.
- `src/components/dashboard/agent-management-table.tsx` - Component for Agency Admins to manage their agents.
- `src/app/(main)/page.tsx` - The main public-facing page displaying the property catalog.
- `src/app/property/[id]/page.tsx` - The detailed view page for a single property.
- `src/components/public/property-card.tsx` - Component to display a single property in the catalog.
- `src/components/public/property-filters.tsx` - Component for the advanced property filtering UI.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 **Foundation & Database Setup**

  - [x] 1.1 Define `User`, `Agency`, and `Property` models in `prisma/schema.prisma`.
  - [x] 1.2 Define an `enum` for `Role` (e.g., `SUPER_ADMIN`, `AGENCY_ADMIN`, `AGENT`, `PUBLIC_USER`).
  - [x] 1.3 Establish relations: a `User` has a `Role` and belongs to an `Agency`; an `Agency` has many `Users`; a `Property` is created by a `User` (Agent).
  - [x] 1.4 Add fields to `Property` for type, location, price, features, transaction type, status (e.g., `PENDING`, `APPROVED`, `REJECTED`), etc.
  - [ ] 1.5 Run `pnpm prisma migrate dev --name init-ubigroup-schema` to apply the new schema to the database.
  - [ ] 1.6 (Optional) Create a Prisma seed script to populate the database with initial roles and a super admin user.

- [ ] 2.0 **Backend API & Authentication**

  - [ ] 2.1 Implement role-based access control middleware in `src/middleware.ts` to protect API and dashboard routes.
  - [ ] 2.2 Create API route (`/api/properties`) for property CRUD operations, ensuring only agents can create/update their own properties.
  - [ ] 2.3 Create API route (`/api/agencies`) for Super Admins to perform CRUD on agencies.
  - [ ] 2.4 Create API route (`/api/agents`) for Agency Admins to create and manage agent accounts within their agency.
  - [ ] 2.5 Add an endpoint for Agency Admins to approve or reject pending property listings.
  - [ ] 2.6 Create API endpoints to fetch the specific metrics required for each dashboard role.
  - [ ] 2.7 Implement Zod validation for all incoming API requests.

- [ ] 3.0 **Administrative Dashboard - UI/UX**

  - [ ] 3.1 Create a shared layout for the dashboard in `src/app/(dashboard)/layout.tsx` with sidebar navigation.
  - [ ] 3.2 **Agent Dashboard:**
    - [ ] 3.2.1 Build a form (`property-form.tsx`) for creating/editing properties with image upload functionality.
    - [ ] 3.2.2 Create a page to display a table of the agent's own properties with their status.
    - [ ] 3.2.3 Implement the UI for the agent's personal dashboard showing basic metrics.
  - [ ] 3.3 **Agency Admin Dashboard:**
    - [ ] 3.3.1 Build a user management page with a table to display, create, and suspend agents.
    - [ ] 3.3.2 Create a property management page to oversee all properties from their agency.
    - [ ] 3.3.3 Implement a queue for pending listings with "Approve" and "Reject" buttons.
  - [ ] 3.4 **Super Admin Dashboard:**
    - [ ] 3.4.1 Build an agency management page with a table to display, create, and suspend agencies.
    - [ ] 3.4.2 Create a global view of all properties and users on the platform.
    - [ ] 3.4.3 Implement the UI for displaying platform-wide metrics.

- [ ] 4.0 **Public Portal - UI/UX**

  - [ ] 4.1 Develop the main page (`src/app/(main)/page.tsx`) to display the catalog of approved properties.
  - [ ] 4.2 Create a `property-card.tsx` component to display summary info for each property in the catalog.
  - [ ] 4.3 Build the `property-filters.tsx` component with controls for all specified filter options.
  - [ ] 4.4 Implement the smart search bar with autocomplete functionality.
  - [ ] 4.5 Create the detailed property page (`src/app/property/[id]/page.tsx`) showing the image gallery, description, map, and agent contact info.
  - [ ] 4.6 Ensure all public-facing components are fully responsive.

- [ ] 5.0 **Integration & Quality Assurance**
  - [ ] 5.1 Use React Query (`@tanstack/react-query`) hooks to connect all dashboard UI components to the backend API endpoints.
  - [ ] 5.2 Wire the public portal filters and search to the properties API to fetch and display results.
  - [ ] 5.3 Ensure the property approval workflow functions end-to-end.
  - [ ] 5.4 Write unit tests for critical components (e.g., `property-form`, `property-filters`) and utility functions.
  - [ ] 5.5 Perform end-to-end testing on key user stories (e.g., agent signs up, creates listing, admin approves, public user views and contacts agent).
  - [ ] 5.6 Manually test and verify that all role-based permissions are correctly enforced across the dashboard.
