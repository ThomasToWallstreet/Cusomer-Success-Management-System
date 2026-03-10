import { bootstrapSupervisorIfNeeded } from "@/lib/auth/account-service";

async function main() {
  await bootstrapSupervisorIfNeeded();
  console.log("auth bootstrap done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
