import { NextResponse } from "next/server";

import { sendWecomMarkdown } from "@/lib/integrations/wecom";
import { buildReminderMarkdown, scanWeeklyReportReminders } from "@/lib/reminders/weekly-report-reminder";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("x-internal-token");
  const expectedToken = process.env.INTERNAL_CRON_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const reminders = await scanWeeklyReportReminders();
  const webhook = process.env.WECOM_WEBHOOK_URL;
  let wecomPushed = false;
  if (webhook && reminders.length) {
    const markdown = buildReminderMarkdown(reminders);
    await sendWecomMarkdown(webhook, markdown);
    wecomPushed = true;
  }

  return NextResponse.json({
    total: reminders.length,
    wecomPushed,
    reminders,
  });
}
