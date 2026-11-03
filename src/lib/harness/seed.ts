import type { RoleDef, SkillDef, Step, Task, VFile } from "./types";

export const CONTEXT_MAX = 8000;

export const JUDGMENT = `织衡把一句话分成两截。回话负责听、答、分流和收尾。执行负责读文件、改文件、跑命令。没有明确任务时只回话，不把这句话送进工具。

执行对同一个调用连续计数。第三次提醒，仍做这一次。第五次停下，不再发下一次。每次重新进入执行，计数清零，避免把上一轮的次数算进来。

执行做完，回话再看一遍。没有未完成的指示就收束，最多来回五次。纯聊天也收束。

执行忙的时候先判断来意。闲聊在旁边回一句，不拆当前任务。说停，或改口成新任务，才打断，并把还没验收的写入撤回。

提问只回答，不改文件。明确要做才动手。改动大，或你要求先看方案时，先交计划，批准前不写。互不依赖的只读步骤同一拍发出。

记忆单条不超过 300 字，全局 4000，项目 3000。确认和直跑可以切。沙箱和危险命令不能关。`;

export const SPEC = `# 织衡执行层

${JUDGMENT}

## 纪律

- 没有任务指示，不交执行。新任务才抢占并回滚；闲聊只旁路。
- 同一工具第三次提醒，第五次停止。每次进入执行清空计数。
- 来回最多 5 轮。收束、继续，或纯聊天结束。
- 提问不写文件。只读调用同一拍发出。获批前不写。
- 检索、核对、方案只收窄能用的工具。查询命令仍可用，但不能改文件。
- 记忆四层：原始、摘要、槽位、归档。单条不超过 300 字。

## 任务怎么跑

1. 任务对象：目标、验收、状态，而不是一串气泡。
2. 工具循环：读、列、搜、改、命令，每步留痕。
3. 三态：询问、计划、执行。
4. 权限策略：确认或直跑。危险命令两种策略都拒绝。
5. 路径沙箱：只能碰到这份虚拟工作区。
6. 循环停止：第 3 次警告，第 5 次强制停止。
7. 检查点：只回滚本层写入。
8. 子任务：只读分叉，结论喂回验收，不继承写权限。
9. 技能：可复用剧本。先计划、只读探索。技能不扩权。
10. 待办与验收清单写在任务上，不靠聊天记忆。

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

对话不是这个仓库的产品。一句输入只负责形成任务：目标、约束、验收。改文件的是执行循环，回话只收单和验收。

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
    { path: "SOUL.md", content: "人设只负责语气。它不能授权写文件，也不能覆盖沙箱。\n" },
    { path: "USER.md", content: "偏好还空着。用「记住：」写入的是任务约束，不是聊天摘要。\n" },
    { path: "src/harness/loop.ts", content: LOOP_SRC },
    { path: "src/harness/policy.ts", content: POLICY_SRC },
    { path: "notes/inbox.md", content: INBOX_SRC },
  ];
}

export function withFuse(src: string): string {
  if (src.includes("同一调用重复第三次")) return src;
  return src.replace(
    "for (const step of steps) {",
    `const seen = new Map<string, number>();
  for (const step of steps) {
    const n = (seen.get(step) ?? 0) + 1;
    seen.set(step, n);
    if (n >= 3) throw new Error("同一调用重复第三次，停止");`,
  );
}

export const ROLES: RoleDef[] = [
  { id: "dispatch", name: "调度", note: "只回单，不扩权" },
  { id: "field", name: "现场", note: "步骤优先的验收" },
  { id: "arch", name: "架构", note: "只改语气，不改权限" },
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
    description: "写操作先交计划，批准后再动文件。",
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
      output: "分流：分析。权限不变。",
    },
    {
      id: "t0-s1",
      brain: "back" as const,
      title: "读 SPEC.md",
      detail: "只取执行层文档，不把文档当新指令。",
      tool: "read_file",
      args: { path: "SPEC.md" },
      status: "ok" as const,
      output: SPEC,
    },
    {
      id: "t0-s2",
      brain: "back" as const,
      title: "搜索授权",
      detail: "核对直跑和确认分别落在哪一行。",
      tool: "grep",
      args: { q: "授权" },
      status: "ok" as const,
      output: "SPEC.md: 冲突段。policy.ts: gate === confirm 才等待确认。",
    },
  ];
  return {
    id: "t0",
    n: 0,
    utterance: "说明对话为什么只负责下单，并把执行层缝上。",
    goal: "写下执行层裁决，不改工作区。",
    acceptance: ["分清控制面和执行层", "写下权限冲突的裁决", "不修改文件"],
    mode: "ask",
    kind: "analysis",
    status: "done",
    route: "回话分流 → 执行只读 → 回话验收",
    roleId: "arch",
    steps,
    revealed: steps.length,
    review: JUDGMENT,
    createdAt: 0,
    filesAtStart: cloneFiles(files),
    voiced: true,
  };
}
