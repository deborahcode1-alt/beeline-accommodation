// Applies database migrations before a build. The database sometimes times out on the first
// try (a temporary lock), so retry a few times before giving up.
const { spawnSync } = require("node:child_process");

const ATTEMPTS = 4;
const WAIT_SECONDS = 12;

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const result = spawnSync("npx prisma migrate deploy", { shell: true, stdio: "inherit" });
  if (result.status === 0) process.exit(0);
  if (attempt === ATTEMPTS) {
    console.error(`Migrations failed after ${ATTEMPTS} attempts.`);
    process.exit(result.status ?? 1);
  }
  console.error(`Migration attempt ${attempt} failed. Retrying in ${WAIT_SECONDS} seconds...`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, WAIT_SECONDS * 1000);
}
