import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:graoalto_dev@localhost:5432/grao_alto_test";

/** Roda uma única vez para todo o test run — evita workers concorrentes
 * disputando `prisma db push` no mesmo banco (cada um em seu próprio
 * processo/worker do Vitest). */
export default function globalSetup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
