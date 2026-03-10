import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CustomerScenarioAttachment } from "@prisma/client";

import { prisma } from "@/lib/db";

const SCENARIO_ATTACHMENT_DIR = path.join(process.cwd(), "public", "uploads", "customer-scenarios");
const MAX_ATTACHMENT_COUNT = 10;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
]);
const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".txt"]);

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120) || "attachment";
}

function getExtension(filename: string) {
  return path.extname(filename || "").toLowerCase();
}

function validateScenarioAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENT_COUNT) {
    throw new Error(`关键场景附件最多上传 ${MAX_ATTACHMENT_COUNT} 个文件`);
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`附件“${file.name}”超过 10MB 限制`);
    }
    const extension = getExtension(file.name);
    const mimeType = file.type || "application/octet-stream";
    if (!allowedMimeTypes.has(mimeType) && !allowedExtensions.has(extension)) {
      throw new Error(`附件“${file.name}”格式不支持，请上传 PDF、Word、Excel、图片或 TXT 文件`);
    }
  }
}

export function getScenarioAttachmentFiles(formData: FormData) {
  return formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function saveScenarioAttachments(scenarioItemId: string, files: File[]) {
  if (!files.length) return [];

  validateScenarioAttachments(files);
  const targetDir = path.join(SCENARIO_ATTACHMENT_DIR, scenarioItemId);
  await mkdir(targetDir, { recursive: true });

  const savedAttachments: Array<{ filePath: string; id: string }> = [];

  try {
    for (const file of files) {
      const extension = getExtension(file.name);
      const storedName = `${Date.now()}-${randomUUID()}-${sanitizeFilename(path.basename(file.name, extension))}${extension}`;
      const absolutePath = path.join(targetDir, storedName);
      const fileUrl = `/uploads/customer-scenarios/${scenarioItemId}/${storedName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(absolutePath, buffer);
      const attachment = await prisma.customerScenarioAttachment.create({
        data: {
          scenarioItemId,
          originalName: file.name,
          storedName,
          fileUrl,
          mimeType: file.type || null,
          fileSize: file.size,
        },
      });
      savedAttachments.push({ filePath: absolutePath, id: attachment.id });
    }
  } catch (error) {
    await Promise.all(
      savedAttachments.map(async (attachment) => {
        await Promise.all([
          prisma.customerScenarioAttachment.delete({ where: { id: attachment.id } }).catch(() => undefined),
          unlink(attachment.filePath).catch(() => undefined),
        ]);
      }),
    );
    throw error;
  }
}

export async function deleteScenarioAttachmentFiles(attachments: Array<Pick<CustomerScenarioAttachment, "id" | "scenarioItemId" | "storedName">>) {
  if (!attachments.length) return;

  await Promise.all(
    attachments.map(async (attachment) => {
      const absolutePath = path.join(SCENARIO_ATTACHMENT_DIR, attachment.scenarioItemId, attachment.storedName);
      await unlink(absolutePath).catch(() => undefined);
    }),
  );

  await prisma.customerScenarioAttachment.deleteMany({
    where: { id: { in: attachments.map((attachment) => attachment.id) } },
  });
}
