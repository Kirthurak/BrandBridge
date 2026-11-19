# BrandBridge

**An AI-powered marketplace concept connecting brands and game developers through in-game advertising, product placement, and strategic partnerships.**

BrandBridge helps brands identify suitable games and product-placement opportunities, aims to estimate campaign performance and potential return on investment (ROI), and helps game developers discover potential sources of development funding.

The project explores how artificial intelligence, data-driven recommendations, and marketplace technology can create new opportunities within the gaming and advertising industries.
The platform also aims to connect investors with promising games and game-development ventures. Investors could evaluate a game's commercial potential, provide development funding, and potentially acquire equity ownership in eligible game studios or ventures, allowing them to participate in future financial growth.

BrandBridge's long-term vision is to combine AI-powered recommendations, predictive analytics, advertising partnerships, and investment discovery within one marketplace.

**Project Status:** Active Development — Functional Full-Stack Prototype

## Overview

Traditional advertising and gaming partnerships can be difficult to establish. Brands may struggle to identify suitable gaming audiences, while independent game developers may lack access to advertising partnerships and alternative funding opportunities.

BrandBridge aims to address these challenges by providing a centralised platform where brands and game developers can discover opportunities, communicate, and establish partnerships.

The long-term vision is to introduce AI-assisted matching, campaign forecasting, confidence estimates, and ROI analysis to support better partnership decisions.

## Current Features

### Brand Experience

- Brand account registration and authentication.
- Brand onboarding and company profile creation.
- Campaign objectives, audience preferences, and advertising budgets.
- Game discovery and matching interface.
- Brand dashboard for managing marketplace activity.
- Partnership proposals and communication with developers.
- Notifications for new partnership messages.

### Game Developer Experience

- Developer registration and authentication.
- Game studio onboarding.
- Game listings with descriptions, genres, platforms, and audience information.
- Advertising placement options and starting prices.
- Developer dashboard for managing game listings and proposals.
- Partnership proposal review and acceptance.
- Communication with interested brands.
- Notifications for partnership messages.

### Partnership Management

- Shared partnership workspaces.
- Database-backed partnership messages.
- Notifications triggered by new messages.
- Unread notification counters.
- Mark-as-read functionality.
- Real-time notification updates.

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend Services | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Real-Time Features | Supabase Realtime |
| Version Control | Git and GitHub |
| Development Environment | Visual Studio Code |

## Application Architecture

BrandBridge uses a full-stack web application architecture built around Next.js and Supabase.

The Next.js application provides the user interface, navigation, onboarding workflows, and marketplace functionality.

Supabase provides authentication, PostgreSQL database services, and real-time capabilities.

The application manages information relating to brands, developers, games, partnership proposals, messages, and notifications.

Database triggers support the creation of notifications when partnership messages are submitted.

## Planned Features

The following capabilities are part of the project's development roadmap and should not be considered fully implemented.

### AI-Powered Game Matching

Develop a recommendation system that evaluates compatibility between brands and games using factors such as:

- Audience demographics.
- Game genres.
- Advertising objectives.
- Platform compatibility.
- Campaign budgets.
- Available advertising placements.

### Campaign Performance Forecasting

Explore predictive models that estimate:

- Potential advertising reach.
- Audience engagement.
- Campaign performance.
- Expected ROI ranges.
- Confidence levels and forecasting uncertainty.

### Developer Funding Opportunities

Expand the marketplace to help developers identify potential sources of funding through advertising partnerships, sponsorships, and other commercial opportunities.

### Marketplace Enhancements

- Advanced search and filtering.
- Improved campaign management.
- Analytics dashboards.
- Expanded partnership workflows.
- Deployment and production-readiness improvements.

## Getting Started

### Prerequisites

- Node.js
- npm
- A Supabase project

### Installation

Clone the repository:

```bash
git clone https://github.com/Kirthurak/BrandBridge.git
```

Navigate to the project directory:

```bash
cd BrandBridge
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root and configure your Supabase environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Note:** Running the application requires a compatible Supabase database schema, authentication configuration, and appropriate Row Level Security policies. The repository does not currently provide a complete automated database setup.

## Security

BrandBridge uses Supabase authentication and PostgreSQL Row Level Security policies to support controlled access to application data.

Environment files containing local configuration are excluded from version control.

Never commit database passwords, service-role keys, private API keys, or other sensitive credentials.

## Development Progress

The current prototype demonstrates the core marketplace workflow:

1. A brand creates an account and completes onboarding.
2. A developer registers a studio and lists a game.
3. The brand explores potential advertising opportunities.
4. The brand submits a partnership proposal.
5. The developer reviews and accepts the proposal.
6. Both parties communicate through a shared partnership workspace.
7. Notifications inform users about new partnership messages.

This workflow provides a foundation for future recommendation, forecasting, and funding-discovery capabilities.

## Project Goals

BrandBridge is an independent software engineering project focused on developing practical experience in:

- Full-stack application development.
- Database design and management.
- Authentication and access control.
- Real-time application features.
- Marketplace architecture.
- AI-assisted recommendation systems.
- Predictive analytics and data-driven decision-making.

## Author

**Kirk Arthur**

Bachelor of Science in Computer Science — Southern New Hampshire University

GitHub: https://github.com/Kirthurak

## Disclaimer

BrandBridge is an independently developed prototype intended for learning, experimentation, and further development.

Example brands, studios, games, campaign metrics, and partnership scenarios used for demonstration purposes do not represent verified commercial relationships or actual advertising performance.