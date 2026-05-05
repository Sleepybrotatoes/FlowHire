# FlowHire

FlowHire is a small-team ATS scaffold with a Kanban hiring pipeline.

## Stack

- Next.js app in `apps/web`
- Express API in `apps/api`
- PostgreSQL data model with Prisma in `packages/db`
- Tailwind CSS for the interface

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` in `.env` for your local PostgreSQL database.

4. Generate the Prisma client and run the first migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start the app and API:

   ```bash
   npm run dev
   ```

The web app runs at `http://localhost:3000` and the API runs at `http://localhost:4000`.

## MVP Scope

- Jobs, candidates, applications, interviews, users, and organizations schema
- Kanban stages: Applied, Screening, Interview, Offer, Rejected
- Drag and drop stage movement in the web app
- Express routes for applications, jobs, candidates, stages, and auto-response stubbing
