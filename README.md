# FeedbackPro - Next.js Full Stack Application

A comprehensive feedback collection platform built with Next.js, allowing businesses to gather authentic customer feedback via SMS and QR codes.

## Features

- **QR Code Feedback**: Generate QR codes for instant feedback collection
- **SMS Feedback**: Send unique, single-use feedback links via SMS
- **Analytics Dashboard**: Track response rates and analyze feedback data
- **Tamper-Proof System**: Ensure feedback integrity with a system that prevents manipulation
- **Incentive System**: Reward customers who provide feedback with discount codes

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (without Prisma adapter)
- **Authentication**: NextAuth.js

## Project Structure

The project follows a clear organization pattern:

- `app/(public)/` - Public-facing pages (landing, features, etc.)
- `app/(auth)/` - Authentication-related pages
- `app/(dashboard)/` - Authenticated user dashboard pages
- `components/shared/` - Reusable components used across the application
- `components/features/public/` - Feature-specific components for public pages
- `lib/` - Utility functions and shared logic

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ZubaydullaCoder/feedbackpro_nextjs_full_stack_javascript_without_prisma_adapter.git
   cd feedbackpro_nextjs_full_stack_javascript_without_prisma_adapter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development Approach

This project follows best practices for component organization and reusability:

- **Component Composition**: Building complex UIs by composing smaller components
- **Container System**: Consistent spacing and width constraints across the application
- **Feature-Based Organization**: Components grouped by feature rather than by type
- **Responsive Design**: Layouts that work well on all device sizes

## License

[MIT](LICENSE)
