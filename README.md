# SQL Visualizer: Semantic Data-Flow Engine

A high-performance SQL visualization and explanation engine that transforms complex SQL queries into intuitive, semantic relational data-flow diagrams. Unlike traditional tools that visualize SQL syntax, this application models **Logical Query Plans**, tracking schema evolution and data lineage from source tables to final results.

![SQL Visualizer Dashboard](public/logo.png) <!-- Note: Replace with actual screenshot path if available -->

## 🚀 Key Features

- **Semantic Visualization**: Real-time conversion of SQL into a Relation → Operator → Relation DAG (Directed Acyclic Graph).
- **Interactive Canvas**: Powered by **React Flow**, featuring draggable nodes, relationship highlighting, smooth pan/zoom, and an integrated MiniMap.
- **AI-Powered Explanations**: Deep integration with **Gemini 2.5 Flash** to provide human-readable, plain-English explanations of complex logic.
- **Dynamic Schema Propagation**: Automatically infers column types and tracks lineage (source table/column) through every transformation (Join, Filter, Project, Aggregate).
- **Logical Query Planner**: Custom planner built on `pgsql-ast-parser` with a robust regex-based fallback for cross-dialect compatibility (Oracle, MySQL, Postgres).
- **Diagram Persistence**: Secure user dashboard to save, organize, and manage your SQL visualizations.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Graph Engine**: [React Flow](https://reactflow.dev/) (Interactivity) & [ELK.js](https://github.com/kieler/elkjs) (Auto-layout)
- **Intelligence**: [Google Gemini 2.5 Flash](https://ai.google.dev/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Google Provider
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Parser**: `pgsql-ast-parser` for robust AST generation

## 🏗 Architectural Blueprint

The application follows a modular 4-layer architecture:

1.  **Parsing Layer**: Raw SQL is parsed into a structured AST.
2.  **Semantic Layer (Planner)**: The AST is transformed into a Logical Plan consisting of `RelationNode` (data structures) and `OperatorNode` (transformations).
3.  **Layout Layer**: ELK.js (Eclipse Layout Kernel) calculates optimal coordinates for the graph while maintaining hierarchical data flow.
4.  **Rendering Layer**: React Flow renders the interactive canvas with custom components for Relations (showing schemas) and Operators.

## 📁 Project Structure

```text
sql-visualizer/
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── api/              # Backend endpoints (Auth, Diagrams, Gemini)
│   ├── dashboard/        # User diagram management
│   └── visualize/        # Main workspace (Editor + Canvas)
├── components/           # UI Components
│   ├── nodes/            # Custom React Flow node components
│   └── ui/               # Reusable Shadcn primitives
├── lib/                  # Core Business Logic
│   ├── sql/              # SQL Planner, Types, and Parser logic
│   ├── graph/            # ELK Layout adapter and Graph types
│   └── auth.ts           # NextAuth configuration
├── store/                # State management (Zustand)
├── db/                   # Database schema and connection
└── docs/                 # Requirements and design documentation
```

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Neon PostgreSQL Database
- Google AI API Key (for explanations)
- Google OAuth Client ID/Secret (for auth)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables (`.env`):
   ```env
   DATABASE_URL=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   NEXTAUTH_SECRET=
   GEMINI_API_KEY=
   ```
4. Run migrations:
   ```bash
   npx drizzle-kit push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
