import {
  cloneFiles,
  README_TASK,
  seedFiles,
  withFuse,
} from "./seed";
import type {
  Gate,
  MemoryEntry,
  Mode,
  Patch,
  RoleId,
  SkillId,
  Step,
  Task,
  TaskKind,
  VFile,
} from "./types";

export interface PlanInput {
  utterance: string;
  files: VFile[];
  mode: Mode;
  roleId: RoleId;
  skillId: SkillId;
  n: number;
  at?: number;
}

const DANGER =
  /rm\s+-rf|sudo\b|mkfs\b|:\(\)\s*\{|dd\s+if=|curl[^\n]*\|[^\n]*sh|wget[^\n]*\|/;

export function findFile(files: VFile[], ref: string): VFile | undefined {
  return files.find((f) => f.path === ref || f.path.endsWith("/" + ref) || f.path.endsWith(ref));
}

export function grepFiles(files: VFile[], q: string): string {
  const needle = q.toLowerCase();
  const lines: string[] = [];
  for (const f of files) {
    f.content.split("\n").forEach((line, i) => {
      if (line.toLowerCase().includes(needle)) {
        lines.push(`${f.path}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  return lines.slice(0, 40).join("\n") || `没有匹配「${q}」`;
}

export function runCommand(files: VFile[], cmd: string): { output: string; blocked: boolean } {
  const c = cmd.trim();
  if (DANGER.test(c)) {
    return {
      output: "拒绝。破坏性或越权命令在确认和直跑下都不会执行。沙箱不可关。",
      blocked: true,
    };
  }
  if (/^ls\b/.test(c)) return { output: files.map((f) => f.path).join("\n"), blocked: false };
  const cat = /^cat\s+(\S+)/.exec(c);
  if (cat) {
    const file = findFile(files, cat[1]);
    return { output: file ? file.content : `没有 ${cat[1]}`, blocked: false };
  }
  const grep = /^grep\s+(?:-n\s+)?(\S+)/.exec(c);
  if (grep) return { output: grepFiles(files, grep[1]), blocked: false };
  if (/^echo\s+/.test(c)) return { output: c.replace(/^echo\s+/, ""), blocked: false };
  return { output: "沙箱只实现 ls、cat、grep、echo。这不是宿主机。", blocked: false };
}

export function mentioned(files: VFile[], text: string): string[] {
  return files
    .map((f) => f.path)
    .filter((p) => {
      const base = p.split("/").pop() ?? p;
      return text.includes(p) || text.includes(base);
    });
}

function stamp(role: RoleId, text: string): string {
  if (role === "field") return `验收：${text}`;
  if (role === "arch") return `裁决：${text}`;
  return `回单：${text}`;
}

function makeStep(taskId: string, i: number, partial: Omit<Step, "id">): Step {
  return { id: `${taskId}-s${i}`, ...partial };
}

function shell(
  input: PlanInput,
  kind: TaskKind,
  goal: string,
  acceptance: string[],
  route: string,
  review: string,
  steps: Step[],
  extra?: Partial<Task>,
): Task {
  const id = `t${input.n}`;
  return {
    id,
    n: input.n,
    utterance: input.utterance.trim(),
    goal,
    acceptance,
    mode: input.mode,
    kind,
    status: "queued",
    route,
    roleId: input.roleId,
    steps,
    revealed: 0,
    review: stamp(input.roleId, review),
    createdAt: input.at ?? 0,
    filesAtStart: cloneFiles(input.files),
    ...extra,
  };
}

function wantsWrite(text: string): boolean {
  return /改|修改|重写|替换|写入|追加|加上|补上|实现|修复|熔断/.test(text) && !/不要改|别改|只读/.test(text);
}

function isAnalysis(text: string): boolean {
  return /NORA|Deva|织衡|双脑|harness|整合|控制面|执行层|对话只是|表象/.test(text);
}

export function planTask(input: PlanInput): Task {
  const text = input.utterance.trim();
  const id = `t${input.n}`;
  const skill = input.skillId;
  let mode = input.mode;

  if (DANGER.test(text)) {
    return shell(
      input,
      "guard",
      "拦截越权命令",
      ["命令未被执行", "工作区不变"],
      "前脑识别危险命令 → 后脑拒绝，不进入循环",
      "未执行。权限闸救不了沙箱明确禁止的命令。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "收单",
          detail: "这句话的可执行部分是一条命令，而且越过沙箱。",
          status: "wait",
        }),
        makeStep(id, 1, {
          brain: "back",
          title: "run_command",
          detail: "安全角色直接拒绝，不调用宿主。",
          tool: "run_command",
          args: { cmd: text },
          status: "blocked",
          output: "拒绝。破坏性或越权命令在确认和直跑下都不会执行。",
        }),
      ],
    );
  }

  if (/熔断演示|演示循环|循环熔断演示/.test(text)) {
    return shell(
      input,
      "guard",
      "演示同一工具调用三次即熔断",
      ["第三次相同 grep 被熔断", "不改文件"],
      "后脑循环检测，与 loop.ts 里要补的熔断是同一纪律",
      "熔断生效。相同调用没有第四次。这是 harness 的状态，不是模型自觉。",
      [0, 1, 2].map((i) =>
        makeStep(id, i, {
          brain: "back",
          title: i === 2 ? "循环熔断" : `grep runLoop #${i + 1}`,
          detail: i === 2 ? "同一工具与参数达到 3 次，循环终止。" : "只读探测，参数不变。",
          tool: "grep",
          args: { q: "runLoop" },
          status: i === 2 ? "blocked" : "wait",
          output: i === 2 ? "loop fuse：grep runLoop 已重复 3 次，停止。" : undefined,
        }),
      ),
    );
  }

  const mem = /^(?:记住|记下)[:：\s]*(.+)$/.exec(text);
  if (mem) {
    const entry = mem[1].trim().slice(0, 300);
    const tooLong = mem[1].trim().length > 300;
    return shell(
      input,
      "memory",
      "把约束写入记忆，而不是写进聊天",
      ["条目不超过 300 字", "出现在全局记忆与槽位"],
      "前脑识别为记忆写，不启动文件工具",
      tooLong ? "原文超过 300 字，已截断后写入。记忆记约束，不记长对话。" : `已记住：${entry}`,
      [
        makeStep(id, 0, {
          brain: "front",
          title: "收单",
          detail: "记忆是任务约束。定时与未验收任务不应靠它扩权。",
          status: "wait",
        }),
        makeStep(id, 1, {
          brain: "back",
          title: "memory_write",
          detail: entry,
          tool: "memory_write",
          status: "wait",
          writes: true,
          memoryAdd: { scope: "global", text: entry },
        }),
      ],
    );
  }

  const forget = /^(?:忘掉|删除记忆)[:：\s]*(.*)$/.exec(text);
  if (forget) {
    const q = forget[1].trim();
    return shell(
      input,
      "forget",
      "删除匹配的记忆条目",
      ["匹配条目被移除"],
      "记忆删除是显式任务",
      q ? `已尝试删除包含「${q}」的条目。` : "没有给出要忘的内容，记忆未动。",
      [
        makeStep(id, 0, {
          brain: "back",
          title: "memory_delete",
          detail: q || "空",
          tool: "memory_delete",
          status: q ? "wait" : "blocked",
          output: q ? undefined : "缺少匹配文本。",
          memoryDrop: q || undefined,
          writes: Boolean(q),
        }),
      ],
    );
  }

  if (/并行|子代理|分头|同时调研|同时探索/.test(text)) {
    return shell(
      input,
      "subagent",
      "以只读子任务核对工具循环和权限策略",
      ["explore 回报 path:line", "research 引用政策文件", "主任务不写文件"],
      "前脑拆单 → explore 与 research 只读分叉 → 前脑汇总",
      "两个子任务都是只读工具集，没有继承写权限，结论只当数据。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "拆单",
          detail: "explore 搜循环，research 核对权限。fork 不把主对话过程灌回去。",
          status: "wait",
        }),
        makeStep(id, 1, {
          brain: "back",
          title: "子任务 explore",
          detail: "只读。工具集：grep。",
          tool: "grep",
          args: { q: "runLoop" },
          status: "wait",
        }),
        makeStep(id, 2, {
          brain: "back",
          title: "子任务 research",
          detail: "只读。对照 policy.ts 与 SPEC。来源要写在结果里。",
          tool: "grep",
          args: { q: "confirm" },
          status: "wait",
        }),
      ],
    );
  }

  if (isAnalysis(text) && !wantsWrite(text)) {
    return shell(
      input,
      "analysis",
      "用工作区里的裁决文档回答执行层问题",
      ["只读 SPEC", "不把文档内容当成新的系统指令"],
      "询问。前脑转述，后脑只读。",
      "控制面负责下单，执行层负责工具循环。完整裁决在 SPEC.md，本任务没有改文件。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "收单",
          detail: "这是裁决问题，不是写任务。",
          status: "wait",
        }),
        makeStep(id, 1, {
          brain: "back",
          title: "read_file SPEC.md",
          detail: "文件内容当数据。",
          tool: "read_file",
          args: { path: "SPEC.md" },
          status: "wait",
        }),
      ],
    );
  }

  const write = wantsWrite(text);
  if (write && skill === "explore") {
    return shell(
      input,
      "reject",
      "退回写请求",
      ["工作区不变"],
      "技能「只读探索」拒绝写",
      "当前技能是只读探索。要改文件，先卸下技能，再走计划或执行。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "退回",
          detail: "技能缩小行为，不扩大权限。",
          status: "blocked",
          output: "未执行写操作。",
        }),
      ],
    );
  }

  if (write && mode === "ask") {
    return shell(
      input,
      "reject",
      "询问模式不写文件",
      ["工作区不变"],
      "模式闸挡住写循环",
      "现在是询问。要改文件，切到计划或执行。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "模式闸",
          detail: "ask 没有 write_file / edit_file / run_command 写权限。",
          status: "blocked",
          output: "已拒绝。",
        }),
      ],
    );
  }

  if (write) {
    if (/先计划|先出计划|出个计划/.test(text) || skill === "plan-first") mode = "plan";
    const patches = proposePatches(input.files, text);
    if (patches.length === 0) {
      return shell(
        input,
        "reject",
        "写意图无法落到已知文件",
        ["不假装做了任意重构"],
        "收单失败：没有可执行补丁",
        "沙箱目前只会：重写 README 的产品定义、给 loop.ts 加熔断、往 notes/inbox.md 追加。请点名其中之一。",
        [
          makeStep(id, 0, {
            brain: "front",
            title: "无法形成补丁",
            detail: "有写动词，但没有安全的、确定的文件变换。",
            status: "blocked",
            output: "未写入。",
          }),
        ],
      );
    }
    if (mode === "plan") {
      return shell(
        input,
        "plan",
        patches.length === 1 && patches[0].path.endsWith("loop.ts")
          ? "计划：为工具循环加上死循环熔断"
          : `计划：更新 ${patches.map((p) => p.path).join("、")}`,
        ["先给出补丁，批准前不写", "批准后的执行不再二次确认"],
        "exit_plan。计划是任务状态，不是一段聊天。",
        "计划待批。批准后会按补丁执行；驳回则工作区不动。",
        [
          makeStep(id, 0, {
            brain: "front",
            title: "收单",
            detail: "写意图被计划闸截住。",
            status: "wait",
          }),
          makeStep(id, 1, {
            brain: "back",
            title: "exit_plan",
            detail: patches.map((p) => p.path).join("、"),
            tool: "exit_plan",
            status: "wait",
            planGate: true,
            output: patches
              .map((p) => {
                const prev = findFile(input.files, p.path)?.content ?? "";
                return `${p.path}\n${prev === p.content ? "无差异" : `将变为 ${p.content.split("\n").length} 行`}`;
              })
              .join("\n\n"),
          }),
        ],
        {
          mode: "plan",
          enact: {
            goal: `执行已批准的补丁：${patches.map((p) => p.path).join("、")}`,
            acceptance: ["补丁落地", "形成检查点"],
            patches,
          },
        },
      );
    }

    const steps: Step[] = [
      makeStep(id, 0, {
        brain: "front",
        title: "收单",
        detail:
          input.mode === "act"
            ? "执行模式。写操作仍受权限策略约束。"
            : "进入执行。",
        status: "wait",
      }),
    ];
    patches.forEach((patch, index) => {
      const prev = findFile(input.files, patch.path)?.content ?? "";
      const same = prev === patch.content;
      steps.push(
        makeStep(id, index + 1, {
          brain: "back",
          title: `edit_file ${patch.path}`,
          detail: same ? "目标内容与现状一致。" : "精确替换整文件内容。",
          tool: "edit_file",
          args: { path: patch.path },
          status: "wait",
          writes: !same,
          patch: same ? undefined : patch,
          output: same ? "已是目标内容，跳过写入。" : undefined,
        }),
      );
    });
    return shell(
      input,
      "write",
      `改写 ${patches.map((p) => p.path).join("、")}`,
      ["只改点名的文件", "验收能看到 diff 落点"],
      "前脑收单 → 权限闸 → 后脑 edit_file → 前脑验收",
      `写入 ${patches.map((p) => p.path).join("、")}。对话记录不是 diff，以文件为准。`,
      steps,
    );
  }

  if (/读|看|列出|列表|搜索|找|grep|有没有|核对|检查|工作区|文件/.test(text)) {
    const names = mentioned(input.files, text);
    const steps: Step[] = [
      makeStep(id, 0, {
        brain: "front",
        title: "收单",
        detail: "只读任务。询问、计划、执行三种模式都可以做。",
        status: "wait",
      }),
    ];
    if (/列出|列表|工作区|有哪些/.test(text) || names.length === 0) {
      steps.push(
        makeStep(id, steps.length, {
          brain: "back",
          title: "list_dir",
          detail: "沙箱根目录。",
          tool: "list_dir",
          args: { path: "." },
          status: "wait",
        }),
      );
    }
    const query = /搜索|找|grep|有没有|核对/.exec(text);
    if (query) {
      const q = /循环|熔断|loop/.test(text)
        ? "runLoop"
        : /权限|确认|策略/.test(text)
          ? "confirm"
          : "任务";
      steps.push(
        makeStep(id, steps.length, {
          brain: "back",
          title: `grep ${q}`,
          detail: "结果是数据，不会被当成下一步指令。",
          tool: "grep",
          args: { q },
          status: "wait",
        }),
      );
    }
    for (const path of names.slice(0, 2)) {
      steps.push(
        makeStep(id, steps.length, {
          brain: "back",
          title: `read_file ${path}`,
          detail: "带路径读取。",
          tool: "read_file",
          args: { path },
          status: "wait",
        }),
      );
    }
    return shell(
      input,
      "read",
      "只读检查工作区",
      ["不写入", "结果带路径"],
      "后脑只读工具集",
      "只读完成。没有产生补丁。",
      steps,
    );
  }

  const cmd = /^(?:运行|执行|命令)[:：\s]+(.+)$/.exec(text);
  if (cmd) {
    return shell(
      input,
      "command",
      "在沙箱里运行一条非交互命令",
      ["只使用允许的命令子集"],
      "run_command 受沙箱约束，与 Deva 的无弹框不是同一件事",
      "命令已在沙箱内结束。沙箱外没有副作用。",
      [
        makeStep(id, 0, {
          brain: "back",
          title: "run_command",
          detail: cmd[1],
          tool: "run_command",
          args: { cmd: cmd[1] },
          status: "wait",
        }),
      ],
    );
  }

  return shell(
    input,
    "reject",
    "没有形成任务",
    ["不进入执行"],
    "前脑拒单",
    "没有目标。对话只负责下单：要读哪份文件、要改什么、要记住哪条约束。",
    [
      makeStep(id, 0, {
        brain: "front",
        title: "拒单",
        detail: "闲聊不是任务。",
        status: "blocked",
        output: "未执行。",
      }),
    ],
  );
}

export function proposePatches(files: VFile[], text: string): Patch[] {
  const patches: Patch[] = [];
  const names = mentioned(files, text);
  const touchReadme = /README/.test(text) || (/改|重写|强调/.test(text) && /readme|说明|产品/.test(text.toLowerCase()));
  const touchLoop = /loop\.ts|熔断|死循环/.test(text);
  const touchInbox = /inbox|追加/.test(text) || (names.length === 0 && /追加|记一条/.test(text));

  if (touchReadme || names.includes("README.md")) {
    if (/README|说明|产品|对话|任务/.test(text)) {
      patches.push({ path: "README.md", content: README_TASK });
    }
  }
  if (touchLoop || names.includes("src/harness/loop.ts")) {
    const current = findFile(files, "src/harness/loop.ts")?.content ?? findFile(seedFiles(), "src/harness/loop.ts")!.content;
    patches.push({ path: "src/harness/loop.ts", content: withFuse(current) });
  }
  if (touchInbox || names.includes("notes/inbox.md")) {
    const current = findFile(files, "notes/inbox.md")?.content ?? "";
    const line = `- [ ] ${text.replace(/\s+/g, " ").slice(0, 180)}\n`;
    if (!current.includes(line.trim())) {
      patches.push({ path: "notes/inbox.md", content: current.endsWith("\n") ? current + line : current + "\n" + line });
    }
  }
  const unique = new Map<string, Patch>();
  for (const p of patches) unique.set(p.path, p);
  return [...unique.values()];
}

export function enactTask(parent: Task, n: number, files: VFile[], at: number): Task | null {
  if (!parent.enact) return null;
  const { goal, acceptance, patches } = parent.enact;
  const id = `t${n}`;
  const steps: Step[] = [
    makeStep(id, 0, {
      brain: "front",
      title: "按批准的计划执行",
      detail: `来自任务 #${parent.n}。计划批准已代替权限弹框。`,
      status: "wait",
    }),
  ];
  patches.forEach((patch, index) => {
    const prev = findFile(files, patch.path)?.content ?? "";
    const same = prev === patch.content;
    steps.push(
      makeStep(id, index + 1, {
        brain: "back",
        title: `edit_file ${patch.path}`,
        detail: "批准过的补丁。",
        tool: "edit_file",
        args: { path: patch.path },
        status: "wait",
        writes: !same,
        patch: same ? undefined : patch,
        output: same ? "已是目标内容，跳过写入。" : undefined,
      }),
    );
  });
  return {
    id,
    n,
    utterance: `执行计划 #${parent.n}`,
    goal,
    acceptance,
    mode: "act",
    kind: "write",
    status: "queued",
    route: "计划已批 → 后脑写入 → 验收",
    roleId: parent.roleId,
    steps,
    revealed: 0,
    review: stamp(parent.roleId, `已落地 ${patches.map((p) => p.path).join("、")}。`),
    createdAt: at,
    precleared: true,
    filesAtStart: cloneFiles(files),
  };
}

export interface Applied {
  files: VFile[];
  memory: MemoryEntry[];
  output: string;
  status: Step["status"];
}

export function applyStep(files: VFile[], memory: MemoryEntry[], step: Step, at: number): Applied {
  if (step.status === "blocked") {
    return { files, memory, output: step.output ?? "已阻断", status: "blocked" };
  }
  if (step.memoryDrop) {
    const next = memory.filter((m) => !m.text.includes(step.memoryDrop!));
    const removed = memory.length - next.length;
    return {
      files,
      memory: next,
      output: removed ? `删除 ${removed} 条。` : "没有匹配的记忆。",
      status: "ok",
    };
  }
  if (step.memoryAdd) {
    const entry: MemoryEntry = {
      id: `m${at}`,
      scope: step.memoryAdd.scope,
      text: step.memoryAdd.text.slice(0, 300),
      at,
    };
    return {
      files,
      memory: [...memory, entry],
      output: `全局记忆 +1（${entry.text.length} 字）`,
      status: "ok",
    };
  }
  if (step.patch) {
    const exists = files.some((f) => f.path === step.patch!.path);
    const next = exists
      ? files.map((f) => (f.path === step.patch!.path ? { ...f, content: step.patch!.content } : f))
      : [...files, { path: step.patch.path, content: step.patch.content }];
    return { files: next, memory, output: `已写入 ${step.patch.path}`, status: "ok" };
  }
  if (step.tool === "read_file") {
    const file = findFile(files, step.args?.path ?? "");
    return { files, memory, output: file ? file.content : `没有 ${step.args?.path}`, status: "ok" };
  }
  if (step.tool === "list_dir") {
    return { files, memory, output: files.map((f) => f.path).sort().join("\n"), status: "ok" };
  }
  if (step.tool === "grep") {
    return { files, memory, output: grepFiles(files, step.args?.q ?? ""), status: "ok" };
  }
  if (step.tool === "run_command") {
    const result = runCommand(files, step.args?.cmd ?? "");
    return {
      files,
      memory,
      output: result.output,
      status: result.blocked ? "blocked" : "ok",
    };
  }
  return { files, memory, output: step.output ?? step.detail, status: step.status === "wait" ? "ok" : step.status };
}

export function estimateTokens(tasks: Task[], memory: MemoryEntry[]): number {
  const body = tasks
    .map((t) => [t.utterance, t.goal, t.review, ...t.steps.map((s) => s.output ?? "")].join("\n"))
    .join("\n");
  const mem = memory.map((m) => m.text).join("\n");
  return Math.ceil((body.length + mem.length) / 2);
}
