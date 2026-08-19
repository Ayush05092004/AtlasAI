# AtlasAI

**An AI-powered project management platform** — inspired by Notion, Jira, Trello, and Linear, built as a full-stack SaaS from the ground up.

> 🚧 Actively in development. Currently shipping v1.0 (auth, projects, tasks, dashboard). See [Roadmap](#roadmap) below.

---

## What it does

AtlasAI lets teams organize work into projects, break work into tasks, and track progress on a real-time kanban board — with an AI assistant planned to help generate tasks, summarize progress, and answer questions about your project (coming in v1.2).

**Currently working:**
- 🔐 Full authentication — register, login, JWT access + refresh tokens, secure logout
- 🏢 Multi-tenant organizations — every user gets a workspace automatically
- 📁 Projects — create, browse, and manage projects with unique keys (e.g. `WEB-42`)
- ✅ Tasks — full CRUD with priority, status, and assignment
- 🗂️ **Kanban board with real drag-and-drop** — five-column workflow (Backlog → To Do → In Progress → In Review → Done), powered by `dnd-kit` with optimistic UI updates
- 📊 Dashboard — live project and task stats, pulled from real data

## Screenshots

*(add screenshots here — login page, dashboard, kanban board)*

## Tech stack

**Frontend**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand (state) · TanStack Query (data fetching)
- React Hook Form + Zod (validation)
- Framer Motion (animation) · dnd-kit (drag-and-drop)

**Backend**
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication with refresh token rotation
- class-validator for request validation

**Infrastructure**
- Docker (PostgreSQL container for local dev)
- Deployment target: Vercel (frontend) + Railway/Render (backend) + Neon (database)

## Architecture

The backend follows a modular, feature-based structure — each domain (`auth`, `organizations`, `projects`, `tasks`) is a self-contained NestJS module with its own controller, service, and DTOs. Every request that touches organization-scoped data passes through a membership check, so users can only ever see or modify resources inside organizations they actually belong to.

The frontend uses Next.js route groups to separate the public auth flow `(auth)` from the authenticated app shell `(dashboard)`, with a shared sidebar and consistent design system across every page.

## Getting started locally

### Prerequisites
- Node.js 20+
- Docker Desktop
- npm

### 1. Clone and install

\```bash
git clone https://github.com/Ayush05092004/AtlasAI.git
cd AtlasAI

cd backend && npm install
cd ../frontend && npm install
\```

### 2. Start the database

From the repo root:

\```bash
docker compose up -d
\```

### 3. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in the values (database URL, JWT secret).

### 4. Run migrations

\```bash
cd backend
npx prisma migrate dev
\```

### 5. Start both servers

\```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run start:dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
\```

Visit `http://localhost:3000` and register a new account to get started.

## Roadmap

- [x] **v1.0** — Authentication, organizations, projects, tasks, kanban board, dashboard
- [ ] **v1.1** — Team invitations, roles & permissions, in-app notifications
- [ ] **v1.2** — AI assistant (task generation, sprint planning, summaries), analytics
- [ ] **v2.0** — Real-time team chat, advanced search, third-party integrations
- [ ] Testing suite (Playwright e2e, unit tests for critical flows)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production deployment

## License

MIT