import { createServerFn } from "@tanstack/react-start";

export const voiceReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const raw = input as { task?: string; trace?: string; role?: string };
    return {
      task: String(raw.task ?? "").slice(0, 1500),
      trace: String(raw.trace ?? "").slice(0, 3500),
      role: String(raw.role ?? "dispatch").slice(0, 24),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "验收模型不可用" };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 280,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "你是织衡的前脑，只做验收转述。不要寒暄，不要标题，不要声称执行了轨迹里没有的工具。120字以内中文，说明做到了什么、没做什么。",
          },
          {
            role: "user",
            content: `角色 ${data.role}\n任务 ${data.task}\n轨迹\n${data.trace}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `模型 ${res.status}` };
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "空转述" };
    return { ok: true as const, text };
  });
