# Test DB: `planificador_basket_db_test`

This backend supports two Jest modes:

- **Contract mode (default):** no DB connection, most integration tests are tolerant and assert status codes/shapes.
- **DB-backed mode:** connects to a real Postgres test DB, runs migrations + seeders, and runs integration tests against real data.

## 1) Required env vars

The Sequelize `test` config uses:

- `TEST_DB_NAME` (defaults to `DB_NAME`)
- `TEST_DB_USER` (defaults to `DB_USER`)
- `TEST_DB_PASSWORD` (defaults to `DB_PASSWORD`)
- `TEST_DB_HOST` (defaults to `DB_HOST`)

For local dev, you typically only need to provide credentials/host once (via your `.env`) and then set `TEST_DB_NAME=planificador_basket_db_test`.

## 2) Prepare the database

These scripts assume the database already exists in Postgres.

```zsh
cd backend
npm run testdb:setup
```

To wipe and re-seed:

```zsh
cd backend
npm run testdb:reset
```

## 3) Run DB-backed integration tests

```zsh
cd backend
TEST_DB_NAME=planificador_basket_db_test USE_TEST_DB=1 npm run test
```

Or using the shortcut script:

```zsh
cd backend
npm run test:db
```

## Notes

- We intentionally keep DB-backed mode behind `USE_TEST_DB=1` to avoid accidental connections during normal unit/contract tests.
- Jest global setup will reset + migrate + seed automatically when `USE_TEST_DB=1`.
