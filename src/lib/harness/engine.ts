import {
  cloneFiles,
  README_TASK,
  seedFiles,
  withFuse,
} from "./seed";
import type {
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

function withReview(taskId: string, steps: Step[], note: string): Step[] {
  return [
    ...steps,
    makeStep(taskId, steps.length, {
      brain: "front",
      title: "审查",
      detail: "执行把结果交回回话。没有新的任务就收束，最多来回 5 次。",
      status: "wait",
      output: note,
    }),
  ];
}

export function chatReply(text: string): string {
  const t = text.trim();
  if (/^(你好|嗨|在吗|在么|哈喽|hello|hi|hey)[!！。.…?？\s]*$/i.test(t)) {
    return "在。这句没有任务，回话直接答，不交执行。要查工作区、改文件或先出计划，说具体目标就行。";
  }
  if (/谢谢|感谢|辛苦/.test(t)) return "不客气。接下来要做事再说。";
  const protocol = protocolAnswer(t);
  if (protocol) return protocol;
  const clipped = t.length > 80 ? `${t.slice(0, 80)}…` : t;
  return `听到了：「${clipped}」。没有任务，所以不交执行。要查、要改、要计划，直接说目标。`;
}

function protocolAnswer(t: string): string | null {
  if (/第\s*[三3五5几].*次|熔断|hint|force/.test(t) && !/补上|改|写入|实现|修复|先计划/.test(t)) {
    return "执行对同一工具连续计数：第三次提醒，仍做这一次；第五次停下，不再发下一次。计数在每次进入执行时清掉。";
  }
  if (/轮询|TASK_DONE|审查怎么/.test(t)) {
    return "来回最多 5 次。执行做完，回话再看：可以收束，也可以再交回去。没有标记的纯聊天直接收束。";
  }
  if (/NEED_BACKEND|什么时候.*后脑|叫后脑|不升级|任务指示/.test(t)) {
    return "光说要执行还不够。没有具体任务时，这句话留在回话里，不会送进工具。";
  }
  if (/打断|抢占|插话|排队/.test(t)) {
    return "执行忙的时候先判断来意：停就停下并撤回未验收写入，改口才换成新任务，闲聊只在旁边回一句。";
  }
  if (/问与做|提问还是|先问/.test(t)) {
    return "提问和动手是两件事。提问、征求意见只回答，不改文件。明确要做才进工具。大改或你要求时才先交计划，批准前不写。";
  }
  if (/子智能体|Explore|只读集合/.test(t)) {
    return "检索、核对、方案只收窄能用的工具，不是另开一道沙箱。它们可以查，不能改文件。没有依赖的只读步骤同一拍发出。";
  }
  return null;
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

function asks(text: string): boolean {
  return /[?？]\s*$/.test(text) || /(吗|呢)[!！。]?\s*$/.test(text) || /^(请问|什么|为什么|为啥|怎么|如何|是否|是不是)/.test(text);
}

function isProtocolTalk(text: string): boolean {
  if (/补上|改|写入|追加|实现|修复|先计划|重写|替换/.test(text)) return false;
  return protocolAnswer(text) !== null;
}

function frontChat(input: PlanInput, reply: string): Task {
  const id = `t${input.n}`;
  return shell(
    input,
    "chat",
    reply,
    ["不调用工具", "用户能看到这句回复"],
    "回话：没有任务，不交执行",
    reply,
    [
      makeStep(id, 0, {
        brain: "front",
        title: "直接回应",
        detail: "没有具体任务，就不交执行。回复里不带内部控制标记。",
        status: "wait",
        output: "交执行：否\n任务指示：空",
      }),
    ],
  );
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
      "回话认出危险命令 → 执行拒绝，不进入循环",
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
          title: "运行命令",
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
      "演示同一调用：第三次提醒，第五次停下",
      ["第三次仍执行并留下提醒", "第五次不再调用", "不改文件"],
      "同一调用第三次提醒，第五次停止。计数只在这一次执行里累加",
      "第三次只提醒，第五次才停下。这是执行状态，不是自觉停手。",
      [1, 2, 3, 4, 5].map((n) =>
        makeStep(id, n - 1, {
          brain: "back",
          title: n === 3 ? "搜索循环 · 第三次提醒" : n === 5 ? "循环停止" : `搜索循环 #${n}`,
          detail:
            n === 3
              ? "连续第三次：提醒，但仍做这次。"
              : n === 5
                ? "连续第五次：在再次调用前停下。"
                : "只读探测，条件不变。",
          tool: n === 5 ? undefined : "grep",
          args: n === 5 ? undefined : { q: "runLoop" },
          status: n === 5 ? "blocked" : "wait",
          output:
            n === 5
              ? "第五次停止：同一搜索已连续 5 次。执行停下，不再发第 6 次。"
              : n === 3
                ? "第三次提醒：同一调用已连续 3 次，这次仍执行。"
                : undefined,
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
      "回话识别为记忆写，不启动文件工具",
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
          title: "写入记忆",
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
          title: "删除记忆",
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
      ["检索回报路径和行号", "核对引用权限文件", "主任务不写文件"],
      "回话拆开 → 检索与核对只读分叉 → 回话汇总",
      "两个子任务都是只读工具集，没有继承写权限，结论只当数据。",
      [
        makeStep(id, 0, {
          brain: "front",
          title: "拆单",
          detail: "检索找循环，核对看权限。分叉不把主过程灌回去。",
          status: "wait",
        }),
        makeStep(id, 1, {
          brain: "back",
          title: "子任务 · 检索",
          detail: "只读。只搜索。",
          tool: "grep",
          args: { q: "runLoop" },
          status: "wait",
          batch: "sub",
        }),
        makeStep(id, 2, {
          brain: "back",
          title: "子任务 · 核对",
          detail: "只读。对照权限文件和裁决。出处写在结果里。不能改文件。",
          tool: "grep",
          args: { q: "confirm" },
          status: "wait",
          batch: "sub",
        }),
        makeStep(id, 3, {
          brain: "front",
          title: "审查",
          detail: "两个只读子任务同一拍返回。结论只当数据，本轮收束。",
          status: "wait",
          output: "收束。子任务不能写，主任务也不再继续。",
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
      "询问。回话转述，执行只读。",
      "控制面负责下单，执行层负责工具循环。完整裁决在 SPEC.md，本任务没有改文件。",
      withReview(
        id,
        [
          makeStep(id, 0, {
            brain: "front",
            title: "收单",
            detail: "这是裁决问题，不是写任务。",
            status: "wait",
          }),
          makeStep(id, 1, {
            brain: "back",
            title: "读 SPEC.md",
            detail: "文件内容当数据。",
            tool: "read_file",
            args: { path: "SPEC.md" },
            status: "wait",
            batch: "read",
          }),
        ],
        "收束。只读裁决，不再交回执行。",
      ),
    );
  }

  if (isProtocolTalk(text) || (asks(text) && !wantsWrite(text))) {
    return frontChat(input, chatReply(text));
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
          detail: "询问模式不能改文件，也不能跑有副作用的命令。",
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
        "提交计划。计划是任务状态，不是一段聊天。",
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
            title: "提交计划",
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
        detail: input.mode === "act" ? "执行模式。写操作仍受权限策略约束。" : "进入执行。",
        status: "wait",
      }),
    ];
    patches.forEach((patch, index) => {
      const prev = findFile(input.files, patch.path)?.content ?? "";
      const same = prev === patch.content;
      steps.push(
        makeStep(id, index + 1, {
          brain: "back",
          title: `改文件 ${patch.path}`,
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
      "回话收单 → 权限闸 → 执行改文件 → 回话审查",
      `写入 ${patches.map((p) => p.path).join("、")}。对话记录不是 diff，以文件为准。`,
      withReview(id, steps, "收束。补丁已落，没有继续执行的理由。"),
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
          title: "列目录",
          detail: "沙箱根目录。",
          tool: "list_dir",
          args: { path: "." },
          status: "wait",
        }),
      );
    }
    const query = /搜索|找|grep|有没有|核对/.exec(text);
    if (query) {
      const q = /循环|熔断|loop/.test(text) ? "runLoop" : /权限|确认|策略/.test(text) ? "confirm" : "任务";
      steps.push(
        makeStep(id, steps.length, {
          brain: "back",
          title: `搜索 ${q}`,
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
          title: `读 ${path}`,
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
      "执行只读，同一拍发出",
      "只读完成。没有产生补丁。",
      withReview(
        id,
        steps.map((step) => (step.brain === "back" ? { ...step, batch: "read" } : step)),
        "收束。只读结果不当成新指令。",
      ),
    );
  }

  const cmd = /^(?:运行|执行|命令)[:：\s]+(.+)$/.exec(text);
  if (cmd) {
    return shell(
      input,
      "command",
      "在沙箱里运行一条非交互命令",
      ["只使用允许的命令子集"],
      "命令留在沙箱里。直跑也不是把机器交出去。",
      "命令已在沙箱内结束。沙箱外没有副作用。",
      withReview(
        id,
        [
          makeStep(id, 0, {
            brain: "back",
            title: "运行命令",
            detail: cmd[1],
            tool: "run_command",
            args: { cmd: cmd[1] },
            status: "wait",
          }),
        ],
        "收束。命令在沙箱内结束。",
      ),
    );
  }

  return frontChat(input, chatReply(text));
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
        title: `改文件 ${patch.path}`,
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
    route: "计划已批 → 执行写入 → 验收",
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
    const text = step.memoryAdd.text.slice(0, 300);
    const cap = step.memoryAdd.scope === "project" ? 3000 : 4000;
    const used = memory
      .filter((m) => m.scope === step.memoryAdd!.scope)
      .reduce((sum, m) => sum + m.text.length, 0);
    if (used + text.length > cap) {
      return {
        files,
        memory,
        output: `${step.memoryAdd.scope === "project" ? "项目" : "全局"}记忆上限 ${cap} 字，这条没写入。`,
        status: "blocked",
      };
    }
    const entry: MemoryEntry = {
      id: `m${at}`,
      scope: step.memoryAdd.scope,
      text,
      at,
    };
    return {
      files,
      memory: [...memory, entry],
      output: `${entry.scope === "project" ? "项目" : "全局"}记忆 +1（${entry.text.length} 字，累计 ${used + entry.text.length}/${cap}）`,
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
