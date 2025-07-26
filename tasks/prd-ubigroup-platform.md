# Product Requirements Document: UbiGroup Platform

## 1. Introduction/Overview

UbiGroup, a leading real estate company, aims to digitalize its operations through a comprehensive web platform. This document outlines the requirements for a modern, scalable solution that will centralize real estate asset management, streamline the property search experience for end-users, and provide robust administrative tools for agencies and agents. The platform will feature a role-based access system to ensure security and control across all operational levels.

## 2. Goals

- **Public Portal:** Create an intuitive public-facing portal for searching, filtering, and viewing real estate properties.
- **Management System:** Implement a secure administrative dashboard with three distinct access levels (Super Admin, Agency Admin, Agent).
- **User Experience:** Ensure a responsive, performant, and seamless user experience across all devices (desktop, tablet, mobile).
- **Scalability:** Build a system architecture that can support future growth and feature expansion.

## 3. User Stories

- **As a potential home buyer,** I want to easily search for properties using various filters and connect with the listing agent to get more information, this role not will be a create account, the information is public for him
- **As a real estate agent,** I want to upload and manage my property listings and view all properties on the platform to better serve potential buyers.
- **As an agency administrator,** I want to manage the agents in my agency, create their platform credentials, and oversee all properties listed by my agency.
- **As a UbiGroup super administrator,** I want to have complete oversight of the platform, including managing agencies, users, and properties, as well as viewing key performance metrics.

## 4. Functional Requirements

### 4.1 Public Portal

1.  **Property Catalog:** The system must display a comprehensive catalog of all active real estate listings.
2.  **Advanced Filtering:** Users must be able to filter properties by:
    - Property type (e.g., house, apartment, office, land)
    - Location (state, city, neighborhood)
    - Price range (min/max sliders or inputs)
    - Key features (bedrooms, bathrooms, garage spaces)
    - Transaction type (sale, rent)
3.  **Smart Search:** The search bar must feature autocomplete suggestions for locations or property types.
4.  **Detailed Property View:** Each property listing must have a dedicated page featuring:
    - An image gallery with high-resolution photos.
    - A full description of the property.
    - A map showing the property's location.
    - Detailed specifications (sqm, rooms, etc.).
    - Agent contact information.
5.  **Agent Contact:** The property page must display the agent's phone number and a direct link to contact them via WhatsApp.
6.  **Responsive Design:** The portal must be fully responsive and functional on desktop, tablet, and mobile devices.

### 4.2 Administrative Dashboard & Roles

#### Role 3: Real Estate Agent

1.  **Authentication:** Agents must be able to log in with credentials created by their Agency Administrator.
2.  **Dashboard:** Agents will have a personal dashboard displaying basic metrics, such as the number of active listings and views per listing.
3.  **Property Management:** Agents must have full CRUD (Create, Read, Update, Delete) functionality for their own property listings.
4.  **Image Upload:** The system must allow agents to upload multiple images for each property.
5.  **Profile Management:** Agents must be able to edit their personal profile information (name, photo, contact details).

#### Role 2: Real Estate Agency Administrator

1.  **Agent Management:** Agency Admins must be able to create, edit, and suspend agent accounts within their agency.
2.  **Property Oversight:** Agency Admins must be able to view and manage all properties listed by agents within their agency.
3.  **Listing Approval:** Listings created by an agent must be approved by their Agency Administrator before they are published to the public portal.
4.  **Dashboard & Metrics:** The dashboard will display agency-specific metrics, such as total listings, top-performing agents, and leads generated.
5.  **Agency Profile:** Agency Admins can configure their agency's business data (name, logo, address).

#### Role 1: UbiGroup Super Administrator

1.  **Full System Control:** Super Admins have the highest level of access and control over the entire platform.
2.  **Agency Management:** Super Admins can create, edit, and suspend real estate agency accounts.
3.  **User Oversight:** Super Admins can view and manage all users on the platform (admins, agents).
4.  **Global Property Management:** Super Admins can oversee and manage all properties listed on the platform.
5.  **Platform-Wide Analytics:** The dashboard must provide access to global metrics, such as platform-wide transaction volume, number of active agencies, and total user count.
6.  **Platform Configuration:** Super Admins can manage platform-wide settings.

## 5. Non-Goals (Out of Scope for Initial Release)

- Mortgage calculation tools.
- Direct integration with third-party CRM systems.
- A blog or news section for real estate articles.
- A built-in user-to-agent messaging system (contact will be via phone/WhatsApp).

## 6. Design Considerations

- The platform should have a clean, modern, and professional aesthetic.
- The user interface should be intuitive and easy to navigate for all user roles.
- Specific branding guidelines (colors, logos, fonts) will be provided at a later stage.

## 7. Technical Considerations

- The platform will be built using the existing technical stack (Next.js, Prisma, TailwindCSS, Supabase).
- All database interactions must be handled through the Prisma client.
- API routes should be secured and role-based access control must be implemented for all dashboard functionalities.

## 8. Success Metrics

- **Public Portal:**
  - Increase in monthly unique visitors.
  - High engagement rate (e.g., number of searches, properties viewed per session).
  - Increase in leads generated for agents (WhatsApp clicks, calls).
- **Admin Dashboard:**
  - High adoption rate among agencies and agents.
  - Reduction in the time it takes for agents to create and manage listings.
  - Consistent usage of reporting features by administrators.
- **Platform:**
  - Page load times under 2 seconds.
  - Uptime greater than 99.5%.

## 9. Open Questions

- What specific information is required to create a new agency?
- What happens to an agent's listings if their account is suspended? Are they unpublished or reassigned?
- What types of documents (besides images) can an agent upload for a property (e.g., floor plans, legal documents)?
- What specific global configurations can the Super Admin manage?
