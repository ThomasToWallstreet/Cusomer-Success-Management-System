type WecomMarkdownPayload = {
  msgtype: "markdown";
  markdown: {
    content: string;
  };
};

export async function sendWecomMarkdown(webhookUrl: string, content: string) {
  const payload: WecomMarkdownPayload = {
    msgtype: "markdown",
    markdown: { content },
  };
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`企微推送失败: ${response.status} ${text}`);
  }
}
