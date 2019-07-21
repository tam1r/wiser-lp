# wiser-lp

## Development

- Install dependencies with `npm install`
- Setup `.env` file with the following environment variables

```
DEV_DB_HOST=localhost
DEV_DB_USER=${mysql user}
DEV_DB_PASSWORD=${password}
DEV_DATABASE_NAME=${mysql database name}

```

- Run project with `npm run dev`

## Upgrading in production environment

1. Checkout that tests are passing (TODO: develop integration/e2e test)
2. Insert the new columns in the production DB (if any)
  Example query to insert new columns:
  ```sql
  ALTER TABLE users ADD ${columnName} ${columnDefinition}
  ```

3. Deploy by merging the staging branch to master
4. Test everything
