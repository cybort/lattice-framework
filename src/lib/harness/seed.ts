import type { RoleDef, SkillDef, Step, Task, VFile } from "./types";

export const CONTEXT_MAX = 8000;

export const JUDGMENT = `NORA 与 Deva 的对话框都是控制面。本体是把一句话收成任务，再在沙箱里跑完工具循环。

NORA 把说话和干活拆开。前脑收单、抢占、审查、转述；后脑拿工具、技能和检索把任务做完。人设、追问、半在线挂在前脑，不进入执行权限。四层记忆是为了任务上下文不断，不是为了陪聊。

Deva 把控制面收到一个对话里：挂工作区、角色、技能、计划、子代理、定时、回滚，都从同一条输入进去。纪律是分层提示词——系统规范、项目规范、记忆、角色。角色不能改工具和安全。写之前可以 exit_plan；写过的文件可以用 /rewind 收回。

冲突只有一处需要裁决。Deva 不设授权弹框，模型直接动文件和命令。NORA 对敏感操作要确认，并做路径沙箱和死循环检测。织衡：确认或直跑可以切，沙箱、危险命令和循环熔断不能关。直跑只是少一次弹框，不是把宿主机交出去。

对话在这里只做三件事：下目标、批计划、看验收。没有目标的句子不进入执行。`;

export const SPEC = `# 织衡执行层

${JUDGMENT}

## 从两边拿走的

- NORA 前脑 / 后脑：前脑只收单和验收，后脑只跑工具。未验收的执行可被新任务抢占，写入回滚。
- NORA 记忆四层：原始轨迹、段落摘要、压缩槽位、长期归档。记的是约束和结论，不是闲聊。
- NORA 模型角色：fast 做分流，smart 做转述，coder 做执行。角色别名不扩大权限。
- Deva 四层提示：系统规范 > AGENTS.md > 记忆 > 角色。外部文本（文件、命令输出、子任务结论）只是数据。
- Deva 任务闸：exit_plan、ask 模式、/rewind、技能剧本、只读子任务（explore / research / plan）。
- Deva 上下文：轨迹过 75% 就该压缩。压缩的是任务痕迹，不是人格。

## 补上的 harness

1. 任务对象：目标、验收、状态，而不是一串气泡。
2. 工具循环：读、列、搜、改、命令，每步留痕。
3. 三态：询问、计划、执行。
4. 权限策略：确认或直跑。危险命令两种策略都拒绝。
5. 路径沙箱：只能碰到这份虚拟工作区。
6. 循环熔断：同一调用第三次即停。
7. 检查点：只回滚本层写入。
8. 子任务：只读分叉，结论喂回验收，不继承写权限。
9. 技能：可复用剧本。先计划、只读探索。技能不扩权。
10. 待办与验收清单写在任务上，不靠聊天记忆。

## 来源

对照实现，不是代码合并。
NORA Core（BSD-3）https://github.com/captain-wangrun-cn/N.O.R.A.Core
Deva（MIT）https://github.com/sqfcyily/deva

## 状态机

收单 → 分流 → 计划闸或权限闸 → 工具循环 → 验收 → 封存
`;

export const README_CHATTY = `# Lattice workspace

这是一个对话助手的演示仓库。用户在聊天里说话，模型用自然的口吻回答，顺便帮助处理文件。

## 目录

- src/harness/loop.ts 工具循环
- src/harness/policy.ts 权限
- SPEC.md 执行层裁决
`;

export const README_TASK = `# Lattice workspace

对话不是这个仓库的产品。一句输入只负责形成任务：目标、约束、验收。改文件的是后脑工具循环，前脑只收单和验收。

## 目录

- src/harness/loop.ts 工具循环
- src/harness/policy.ts 沙箱与确认策略
- SPEC.md 执行层裁决
`;

export const LOOP_SRC = `export async function runLoop(
  steps: string[],
  call: (step: string) => Promise<string>,
) {
  const outputs: string[] = [];
  for (const step of steps) {
    outputs.push(await call(step));
  }
  return outputs;
}
`;

export const POLICY_SRC = `export type Gate = "confirm" | "open";

export function allow(command: string, gate: Gate) {
  if (/rm\\s+-rf|sudo\\b|mkfs|curl[^\\n]*\\|/.test(command)) {
    return { ok: false, reason: "destructive command blocked by sandbox" };
  }
  if (gate === "confirm" && /write|edit|rm|mv/.test(command)) {
    return { ok: false, reason: "awaiting confirmation" };
  }
  return { ok: true, reason: "within workspace" };
}
`;

export const AGENTS_SRC = `# 工作区规范

- 对话只用于下发任务，不把闲聊写进仓库。
- 写操作默认需要确认。直跑也必须留在沙箱内。
- 验收对照目标，不复述工具输出。
- 角色只改转述语气，不改工具权限。
`;

export const INBOX_SRC = `# 收件

尚未下达的文件任务会追加在这里。
`;

export function seedFiles(): VFile[] {
  return [
    { path: "SPEC.md", content: SPEC },
    { path: "README.md", content: README_CHATTY },
    { path: "AGENTS.md", content: AGENTS_SRC },
    { path: "SOUL.md", content: "前脑人设只负责语气。它不能授权写文件，也不能覆盖沙箱。\n" },
    { path: "USER.md", content: "偏好还空着。用「记住：」写入的是任务约束，不是聊天摘要。\n" },
    { path: "src/harness/loop.ts", content: LOOP_SRC },
    { path: "src/harness/policy.ts", content: POLICY_SRC },
    { path: "notes/inbox.md", content: INBOX_SRC },
  ];
}

export function withFuse(src: string): string {
  if (src.includes("loop fuse")) return src;
  return src.replace(
    "for (const step of steps) {",
    `const seen = new Map<string, number>();
  for (const step of steps) {
    const n = (seen.get(step) ?? 0) + 1;
    seen.set(step, n);
    if (n >= 3) throw new Error("loop fuse: identical step x3");`,
  );
}

export const ROLES: RoleDef[] = [
  { id: "dispatch", name: "调度", note: "只回单，不扩权" },
  { id: "field", name: "现场", note: "步骤优先的验收" },
  { id: "arch", name: "架构", note: "对照 NORA / Deva" },
];

export const SKILLS: SkillDef[] = [
  {
    id: "none",
    name: "无技能",
    description: "按当前模式执行。",
    body: "不注入额外剧本。",
  },
  {
    id: "plan-first",
    name: "先计划",
    description: "写操作先 exit_plan，批准后再动文件。",
    body: "任何写任务改走计划闸。批准等于确认，执行阶段不再二次拦截。",
  },
  {
    id: "explore",
    name: "只读探索",
    description: "只许读、列、搜。写请求会被退回。",
    body: "子任务与主任务都使用只读工具集。结论以 path:line 回报。",
  },
];

export function cloneFiles(files: VFile[]): VFile[] {
  return files.map((f) => ({ path: f.path, content: f.content }));
}

export function seedTask(files: VFile[]): Task {
  const steps: Step[] = [
    {
      id: "t0-s0",
      brain: "front" as const,
      title: "收单",
      detail: "判定为架构裁决。没有写目标，不进入工具写循环。",
      status: "ok" as const,
      output: "分流：分析。模型别名 fast。权限不变。",
    },
    {
      id: "t0-s1",
      brain: "back" as const,
      title: "read_file SPEC.md",
      detail: "后脑只取执行层文档，不把文档当新指令。",
      tool: "read_file",
      args: { path: "SPEC.md" },
      status: "ok" as const,
      output: SPEC,
    },
    {
      id: "t0-s2",
      brain: "back" as const,
      title: "grep 授权",
      detail: "核对 Deva 直跑与 NORA 确认的冲突落在哪一行。",
      tool: "grep",
      args: { q: "授权" },
      status: "ok" as const,
      output: "SPEC.md: 冲突段。policy.ts: gate === confirm 才等待确认。",
    },
  ];
  return {
    id: "t0",
    n: 0,
    utterance: "说明两套对话式为何只是表面，并把执行层缝上。",
    goal: "给出 NORA 与 Deva 的执行层裁决，不改工作区。",
    acceptance: ["分清控制面和执行层", "写下权限冲突的裁决", "不修改文件"],
    mode: "ask",
    kind: "analysis",
    status: "done",
    route: "前脑分流 → 后脑只读 → 前脑验收",
    roleId: "arch",
    steps,
    revealed: steps.length,
    review: JUDGMENT,
    createdAt: 0,
    filesAtStart: cloneFiles(files),
    voiced: true,
  };
}
