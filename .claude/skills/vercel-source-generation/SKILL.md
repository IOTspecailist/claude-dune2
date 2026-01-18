---
name: vercel-source-generation
description: Generates and modifies source code optimized for Vercel deployment with Next.js and Postgres. Use when scaffolding new projects, creating API routes, connecting to databases, configuring environment variables, or preparing code for Vercel deployment.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Vercel Source Generation Rules

This skill defines source-generation rules optimized for Vercel development workflows where:
- Development environment: VS Code on Windows
- Code generation: Claude Code
- Version control: GitHub
- Deployment target: Vercel
- Database: Postgres (Vercel Postgres or equivalent) via ORM

---

## When to Apply This Skill

Use this skill when:
- Scaffolding a new Next.js project for Vercel deployment
- Creating or modifying API routes (App Router or Pages Router)
- Setting up database connections with Postgres
- Configuring environment variables for local dev and Vercel
- Writing migrations or database schema changes
- Optimizing code for serverless/edge runtime constraints
- Reviewing code for Vercel deployment compatibility

## When NOT to Apply This Skill

Do not use this skill when:
- Working on non-Vercel deployment targets (AWS Lambda, traditional servers, etc.)
- Building static sites without API routes or database
- Using databases other than Postgres (MongoDB, MySQL, etc.)
- Working with frameworks other than Next.js (Remix, Nuxt, etc.)
- The project explicitly uses a different tech stack

---

## Default Stack

> **Note**: Selections below are derived from common Vercel/Next.js patterns. Items marked with (NOT 100% CERTAIN) are sensible defaults—confirm with project requirements.

| Layer | Selection | Certainty |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router preferred) | Standard for Vercel |
| Language | TypeScript (strict mode) | Best practice |
| ORM | **Drizzle ORM** | (NOT 100% CERTAIN)—Prisma is also common |
| Validation | **Zod** | (NOT 100% CERTAIN)—pairs well with TypeScript |
| Lint/Format | ESLint + Prettier | Standard |
| Package Manager | **pnpm** | (NOT 100% CERTAIN)—npm/yarn also valid |

### Why Drizzle ORM (Assumption)

Drizzle is selected as the default ORM because:
- Lightweight and serverless-friendly (smaller cold start impact)
- TypeScript-first with excellent type inference
- SQL-like syntax for developers familiar with raw SQL
- Works well with Vercel Postgres

**Alternative**: If the project uses Prisma, adapt the patterns accordingly. Prisma requires additional cold start considerations (see Performance section).

---

## Project Scaffolding Rules

### Initial Setup Commands

```bash
# Create new Next.js project with TypeScript
pnpm create next-app@latest project-name --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project
cd project-name

# Install database dependencies (Drizzle + Postgres)
pnpm add drizzle-orm @vercel/postgres
pnpm add -D drizzle-kit

# Install validation
pnpm add zod

# Install dev utilities
pnpm add -D @types/node
```

### Folder/File Conventions

```
project-root/
├── src/
│   ├── app/                    # App Router (pages, layouts, API routes)
│   │   ├── api/                # API routes
│   │   │   └── [resource]/
│   │   │       └── route.ts    # Route handlers
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   └── [feature]/          # Feature-specific components
│   ├── lib/                    # Shared utilities and configurations
│   │   ├── db/
│   │   │   ├── index.ts        # Database client export
│   │   │   ├── schema.ts       # Drizzle schema definitions
│   │   │   └── migrations/     # SQL migration files
│   │   ├── validations/        # Zod schemas
│   │   └── utils.ts            # Helper functions
│   ├── types/                  # TypeScript type definitions
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
├── drizzle.config.ts           # Drizzle configuration
├── next.config.js              # Next.js configuration
├── .env.local                  # Local environment variables (git-ignored)
├── .env.example                # Example env file (committed)
├── tsconfig.json
└── package.json
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `UserCard.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Files (routes) | kebab-case folders | `src/app/api/user-profile/route.ts` |
| React components | PascalCase | `export function UserCard()` |
| Functions | camelCase | `export function getUserById()` |
| Constants | SCREAMING_SNAKE_CASE | `const MAX_RETRY_COUNT = 3` |
| Types/Interfaces | PascalCase | `interface UserProfile` |
| Database tables | snake_case | `user_profiles` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

---

## TypeScript Configuration

Always use TypeScript with strict mode enabled:

```json
// tsconfig.json (key settings)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## API Route Patterns

### App Router Route Handler Structure

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { createUserSchema } from '@/lib/validations/user';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    const result = await db.select().from(users).limit(limit);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const [newUser] = await db.insert(users).values(validated).returning();

    return NextResponse.json({ data: newUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Dynamic Route Parameters

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // ... fetch user by id
}
```

### API Route Rules

**DO:**
- Use `NextRequest` and `NextResponse` from `next/server`
- Validate all inputs with Zod before processing
- Return consistent JSON response shapes: `{ data: ... }` or `{ error: ... }`
- Use appropriate HTTP status codes
- Catch and log errors with context
- Keep route handlers thin—delegate to service functions

**DON'T:**
- Use Node.js-specific APIs not available in Edge Runtime (if using edge)
- Return raw error objects to clients
- Skip input validation
- Use blocking operations without timeouts

---

## Database Connection Pattern (Serverless)

### Drizzle + Vercel Postgres Setup

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Single instance for connection pooling
export const db = drizzle(sql, { schema });
```

```typescript
// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

### Connection Rules for Serverless

**DO:**
- Use `@vercel/postgres` for automatic connection pooling
- Create a single db instance and export it
- Let the driver handle connection lifecycle
- Use transactions for multi-statement operations

**DON'T:**
- Create new connections per request
- Manually manage connection pools
- Leave connections open indefinitely
- Use long-running transactions

---

## Migrations Workflow

### Commands

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations to database
pnpm drizzle-kit migrate

# Open Drizzle Studio (database GUI)
pnpm drizzle-kit studio

# Push schema directly (dev only, no migration files)
pnpm drizzle-kit push
```

### Migration Rules

**DO:**
- Generate migrations for all schema changes
- Review generated SQL before applying
- Test migrations on preview deployments first
- Commit migration files to version control
- Use `drizzle-kit push` only in local development

**DON'T:**
- Edit generated migration files manually (unless necessary)
- Apply migrations directly to production without preview testing
- Delete or rename migration files after they're applied
- Skip migrations and use `push` in production

---

## Environment Variables Setup

### File Structure

```bash
# .env.local (git-ignored, local development)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://...?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Application secrets
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Third-party API keys
STRIPE_SECRET_KEY="sk_test_..."
```

```bash
# .env.example (committed, template for team)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
```

### Vercel Environment Variable Setup

1. **Dashboard**: Settings > Environment Variables
2. **CLI**: `vercel env add VARIABLE_NAME`
3. **Pull to local**: `vercel env pull .env.local`

### Environment Variable Conventions

| Scope | Example | Notes |
|-------|---------|-------|
| Development only | `POSTGRES_URL` in `.env.local` | Never commit |
| Preview + Production | Set in Vercel Dashboard | Auto-injected |
| Public (client-side) | `NEXT_PUBLIC_*` prefix | Exposed to browser |
| Server-only | No prefix | Never exposed to client |

**DO:**
- Use `NEXT_PUBLIC_` prefix only for truly public values
- Pull production env vars using `vercel env pull`
- Validate required env vars at build/startup time
- Use different values per environment (dev/preview/prod)

**DON'T:**
- Commit `.env.local` or any file with real secrets
- Use `NEXT_PUBLIC_` for API keys or secrets
- Hardcode environment-specific values
- Share production secrets in preview environments

### Environment Validation (Recommended)

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  POSTGRES_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

---

## Local Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server locally
pnpm start

# Run linting
pnpm lint

# Run type checking
pnpm tsc --noEmit

# Run tests (if configured)
pnpm test

# Database commands
pnpm drizzle-kit generate    # Generate migrations
pnpm drizzle-kit migrate     # Apply migrations
pnpm drizzle-kit studio      # Open database GUI

# Vercel CLI commands
vercel dev                   # Run with Vercel dev server
vercel env pull .env.local   # Pull env vars from Vercel
vercel --prod                # Deploy to production
```

---

## Vercel-Specific Do/Don't Lists

### Cold Starts

**DO:**
- Keep function bundles small (< 50MB ideal)
- Use dynamic imports for large dependencies
- Prefer Drizzle over Prisma for smaller bundle size
- Use edge runtime for latency-critical routes

**DON'T:**
- Import entire libraries when only using one function
- Bundle unnecessary devDependencies
- Use Prisma without understanding cold start impact (Prisma adds ~1-3s cold start)
- Ignore bundle analyzer output

### Edge vs Node.js Runtime

```typescript
// Force edge runtime (faster cold starts, limited APIs)
export const runtime = 'edge';

// Force Node.js runtime (full Node APIs, slower cold starts)
export const runtime = 'nodejs';
```

**Use Edge Runtime when:**
- Low latency is critical
- Simple request/response transformations
- No Node.js-specific APIs needed

**Use Node.js Runtime when:**
- Using Node.js-specific libraries (fs, crypto, etc.)
- Complex database operations
- File system access needed

### Caching

```typescript
// Static data that rarely changes (ISR)
export const revalidate = 3600; // Revalidate every hour

// Dynamic data (no caching)
export const dynamic = 'force-dynamic';

// Fetch-level caching
const data = await fetch(url, {
  next: { revalidate: 60 } // Cache for 60 seconds
});
```

**DO:**
- Use ISR for semi-static content
- Set appropriate `Cache-Control` headers
- Use `unstable_cache` for expensive computations
- Leverage Vercel's Edge Cache

**DON'T:**
- Cache user-specific or sensitive data
- Forget to invalidate cache after data mutations
- Use overly aggressive caching for dynamic data

### Logging

```typescript
// Use console methods - Vercel captures these
console.log('Info:', data);
console.warn('Warning:', message);
console.error('Error:', error);

// Structured logging (recommended)
console.log(JSON.stringify({
  level: 'info',
  message: 'User created',
  userId: user.id,
  timestamp: new Date().toISOString(),
}));
```

**DO:**
- Use `console.log/warn/error` (Vercel captures these)
- Include context in error logs
- Use structured JSON for easier parsing
- Check Vercel Dashboard > Logs for output

**DON'T:**
- Use custom log transports that write to files
- Log sensitive information (passwords, tokens)
- Rely on log retention beyond Vercel's limits

### Secrets Management

**DO:**
- Store secrets in Vercel Environment Variables
- Use different secrets per environment
- Rotate secrets periodically
- Use `vercel env pull` to sync locally

**DON'T:**
- Commit secrets to git (even in `.env.example`)
- Log secrets or include in error messages
- Share production secrets across environments
- Use the same secret for multiple purposes

### Function Timeout and Memory

```typescript
// Set max duration (Pro/Enterprise only for > 10s)
export const maxDuration = 30; // seconds
```

**Limits (Hobby/Pro):**
- Hobby: 10s max execution, 1024MB memory
- Pro: 60s max (300s with config), 3008MB memory

**DO:**
- Keep functions fast (< 10s ideal)
- Use streaming for long operations
- Offload heavy work to background jobs
- Monitor function duration in Vercel Analytics

**DON'T:**
- Assume unlimited execution time
- Run CPU-intensive work in API routes
- Ignore timeout warnings

---

## Deployment/Preview Workflow

### Git-Based Workflow

1. **Push to branch** > Vercel creates Preview Deployment
2. **Open PR** > Preview URL added to PR comments
3. **Merge to main** > Production deployment triggered

### Branch Naming

| Branch | Environment | URL Pattern |
|--------|-------------|-------------|
| `main` / `master` | Production | `project.vercel.app` |
| `develop` | Preview | `project-develop-xxx.vercel.app` |
| `feature/*` | Preview | `project-feature-xxx.vercel.app` |

### Pre-Deployment Checklist

- [ ] `pnpm build` succeeds locally
- [ ] `pnpm lint` passes
- [ ] TypeScript has no errors (`pnpm tsc --noEmit`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied to preview/production DB
- [ ] No secrets in committed code

### Vercel CLI Commands

```bash
# Link project to Vercel
vercel link

# Deploy preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs [deployment-url]
```

---

## Security Considerations

### Input Validation

Always validate at system boundaries:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).optional(),
});

// In route handler
const result = createUserSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

### SQL Injection Prevention

Drizzle ORM uses parameterized queries by default:

```typescript
// Safe - parameterized
const user = await db.select().from(users).where(eq(users.id, id));

// Safe - using sql template
import { sql } from 'drizzle-orm';
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${id}`);

// NEVER do this
const result = await db.execute(sql.raw(`SELECT * FROM users WHERE id = '${id}'`));
```

### Authentication/Authorization

> **(NOT 100% CERTAIN)**: Use NextAuth.js or Clerk for auth (not specified in guide)

```typescript
// Middleware for protected routes
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}
```

---

## 보안 정보 처리 규칙

다음 규칙은 민감한 보안 정보를 안전하게 처리하기 위한 필수 지침입니다.

### 1. 로그에 보안 정보 저장 금지

보안에 관련된 민감한 정보는 절대로 로그에 저장하지 않습니다.

**저장 금지 대상:**
- `.env.local` 파일 내용
- API 키, 시크릿 키
- 데이터베이스 접속 정보 (POSTGRES_URL, POSTGRES_PASSWORD 등)
- 인증 토큰 (JWT, 세션 토큰 등)
- 사용자 비밀번호 (해시 포함)
- 개인식별정보 (주민번호, 카드번호 등)

```typescript
// NEVER log sensitive data
console.log('DB URL:', process.env.POSTGRES_URL);        // WRONG
console.log('User password:', user.password);            // WRONG
console.log('API Key:', process.env.STRIPE_SECRET_KEY);  // WRONG

// OK - log only non-sensitive context
console.log('Database connection established');          // OK
console.log('User login attempt:', { userId: user.id }); // OK
```

### 2. 보안 정보 출력 금지

보안에 관련된 정보는 화면, 응답, 에러 메시지 등 어떤 형태로도 출력하지 않습니다.

**출력 금지 대상:**
- 환경 변수 값
- 데이터베이스 연결 문자열
- 내부 시스템 경로
- 스택 트레이스의 민감한 정보
- 암호화 키, 솔트 값

```typescript
// WRONG - exposing sensitive info in responses
return NextResponse.json({
  error: 'Database error',
  connectionString: process.env.POSTGRES_URL,  // NEVER
  stack: error.stack,                          // NEVER in production
});

// OK - generic error response
return NextResponse.json({
  error: 'Internal server error',
  code: 'DB_CONNECTION_ERROR',
}, { status: 500 });
```

### 3. Git에 보안 정보 업로드 금지

보안에 관련된 파일 및 정보는 절대로 git 저장소에 커밋하지 않습니다.

**Git 저장소 업로드 금지 대상:**
- `.env.local`, `.env.development.local`, `.env.production.local`
- 실제 값이 포함된 환경 변수 파일
- 인증서 파일 (`.pem`, `.key`, `.crt`)
- 비밀번호나 API 키가 하드코딩된 파일

**.gitignore 필수 포함 항목:**
```gitignore
# Environment files with secrets
.env.local
.env.*.local
.env.development
.env.production

# Certificate files
*.pem
*.key
*.crt

# IDE and system files
.idea/
.vscode/settings.json
*.log
```

**커밋 전 체크리스트:**
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] 코드에 하드코딩된 시크릿이 없는가?
- [ ] `.env.example`에 실제 값 대신 플레이스홀더만 있는가?
- [ ] `git diff`에서 민감한 정보가 노출되지 않는가?

```bash
# Before committing, always check for secrets
git diff --staged | grep -i -E "(password|secret|key|token|api_key)"
```

---

## Quick Reference

### File Creation Checklist

When creating new files, verify:

- [ ] Follows naming convention for file type
- [ ] Placed in correct directory
- [ ] Exports typed (TypeScript)
- [ ] No hardcoded secrets or URLs
- [ ] Imports use `@/*` alias

### API Route Checklist

- [ ] Uses `NextRequest`/`NextResponse`
- [ ] Validates inputs with Zod
- [ ] Returns consistent response shape
- [ ] Handles errors gracefully
- [ ] Logs errors with context
- [ ] No blocking operations without timeout

### Database Operation Checklist

- [ ] Uses parameterized queries
- [ ] Wraps multi-statement ops in transaction
- [ ] Handles connection errors
- [ ] Returns typed results
- [ ] Doesn't leak connection details in errors
