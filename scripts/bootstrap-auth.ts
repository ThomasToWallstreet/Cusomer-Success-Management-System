import { bootstrapSupervisorIfNeeded } from "@/lib/auth/account-service";

async function main() {
  await bootstrapSupervisorIfNeeded();
  // eslint-disable-next-line no-console
  console.log("auth bootstrap done");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
