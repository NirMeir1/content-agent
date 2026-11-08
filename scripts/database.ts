import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { initialize, loadWorkspace, resetDemo } from "../src/lib/db";
async function main() {
  const command = process.argv[2];
  await initialize();
  if (command === "reset") await resetDemo();
  else if (command === "seed") await loadWorkspace("demo");
  console.log(
    command === "reset"
      ? "Fictional demo reset; own workspace preserved."
      : "Database ready.",
  );
}
main().catch(() => {
  console.error(
    "Database setup failed. Check DATABASE_URL and database access.",
  );
  process.exitCode = 1;
});
