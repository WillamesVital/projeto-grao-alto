import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const testDbPath = path.join(rootDir, "prisma", "test.db");

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.AUTH_SECRET = "test-secret-para-vitest-0123456789";
process.env.APP_URL = "http://localhost:3000";

execSync("npx prisma migrate deploy", {
  cwd: rootDir,
  env: { ...process.env },
  stdio: "pipe",
});
