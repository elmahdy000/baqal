# Prisma migrations

Baqal uses Prisma migrations for production schema changes.

## First-time setup (dev)

Requires a running Postgres reachable via `DATABASE_URL`.

```bash
# 1) validate schema
npx prisma validate

# 2) create initial migration
npm run db:migrate -- --name init

# 3) seed dev data (optional)
npm run db:seed
```

## Production deploy

```bash
# Apply pending migrations without prompts
npm run db:migrate:deploy
```

## Development iteration

```bash
# Rapid iteration without migration files (dev only)
npm run db:push

# When schema stabilizes, snapshot as a migration
npm run db:migrate -- --name descriptive_change_name
```

## Notes
- The `prisma/migrations/` directory is checked in — do not edit generated files.
- Always run `npx prisma validate` before creating a migration.
- Never run `db:push` against production; it does not create migration history.
