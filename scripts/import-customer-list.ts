import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { importCustomerListCsvFullReplace } from "@/lib/repos/customer-list-repo";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("请提供 CSV 文件路径，例如: npm run import:customer-list -- \"原型文档/深圳区 的副本.CSV\"");
  }

  const absolutePath = resolve(process.cwd(), inputPath);
  const csvText = await readFile(absolutePath, "utf-8");
  const result = await importCustomerListCsvFullReplace(csvText, absolutePath);

  if (result.errors.length > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        file: absolutePath,
        total: result.total,
        imported: result.imported,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
