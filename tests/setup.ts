process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:graoalto_dev@localhost:5432/grao_alto_test";
process.env.AUTH_SECRET = "test-secret-para-vitest-0123456789";
process.env.APP_URL = "http://localhost:3000";
