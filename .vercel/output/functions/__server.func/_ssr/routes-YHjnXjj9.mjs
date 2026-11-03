import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-YHjnXjj9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CONTEXT_MAX = 8e3;
var JUDGMENT = `织衡把一句话分成两截。回话负责听、答、分流和收尾。执行负责读文件、改文件、跑命令。没有明确任务时只回话，不把这句话送进工具。

执行对同一个调用连续计数。第三次提醒，仍做这一次。第五次停下，不再发下一次。每次重新进入执行，计数清零，避免把上一轮的次数算进来。

执行做完，回话再看一遍。没有未完成的指示就收束，最多来回五次。纯聊天也收束。

执行忙的时候先判断来意。闲聊在旁边回一句，不拆当前任务。说停，或改口成新任务，才打断，并把还没验收的写入撤回。

提问只回答，不改文件。明确要做才动手。改动大，或你要求先看方案时，先交计划，批准前不写。互不依赖的只读步骤同一拍发出。

记忆单条不超过 300 字，全局 4000，项目 3000。确认和直跑可以切。沙箱和危险命令不能关。`;
var SPEC = `# 织衡执行层

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
var README_CHATTY = `# Lattice workspace

这是一个对话助手的演示仓库。用户在聊天里说话，模型用自然的口吻回答，顺便帮助处理文件。

## 目录

- src/harness/loop.ts 工具循环
- src/harness/policy.ts 权限
- SPEC.md 执行层裁决
`;
var README_TASK = `# Lattice workspace

对话不是这个仓库的产品。一句输入只负责形成任务：目标、约束、验收。改文件的是执行循环，回话只收单和验收。

## 目录

- src/harness/loop.ts 工具循环
- src/harness/policy.ts 沙箱与确认策略
- SPEC.md 执行层裁决
`;
var LOOP_SRC = `export async function runLoop(
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
var POLICY_SRC = `export type Gate = "confirm" | "open";

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
var AGENTS_SRC = `# 工作区规范

- 对话只用于下发任务，不把闲聊写进仓库。
- 写操作默认需要确认。直跑也必须留在沙箱内。
- 验收对照目标，不复述工具输出。
- 角色只改转述语气，不改工具权限。
`;
var INBOX_SRC = `# 收件

尚未下达的文件任务会追加在这里。
`;
function seedFiles() {
	return [
		{
			path: "SPEC.md",
			content: SPEC
		},
		{
			path: "README.md",
			content: README_CHATTY
		},
		{
			path: "AGENTS.md",
			content: AGENTS_SRC
		},
		{
			path: "SOUL.md",
			content: "人设只负责语气。它不能授权写文件，也不能覆盖沙箱。\n"
		},
		{
			path: "USER.md",
			content: "偏好还空着。用「记住：」写入的是任务约束，不是聊天摘要。\n"
		},
		{
			path: "src/harness/loop.ts",
			content: LOOP_SRC
		},
		{
			path: "src/harness/policy.ts",
			content: POLICY_SRC
		},
		{
			path: "notes/inbox.md",
			content: INBOX_SRC
		}
	];
}
function withFuse(src) {
	if (src.includes("同一调用重复第三次")) return src;
	return src.replace("for (const step of steps) {", `const seen = new Map<string, number>();
  for (const step of steps) {
    const n = (seen.get(step) ?? 0) + 1;
    seen.set(step, n);
    if (n >= 3) throw new Error("同一调用重复第三次，停止");`);
}
var ROLES = [
	{
		id: "dispatch",
		name: "调度",
		note: "只回单，不扩权"
	},
	{
		id: "field",
		name: "现场",
		note: "步骤优先的验收"
	},
	{
		id: "arch",
		name: "架构",
		note: "只改语气，不改权限"
	}
];
var SKILLS = [
	{
		id: "none",
		name: "无技能",
		description: "按当前模式执行。",
		body: "不注入额外剧本。"
	},
	{
		id: "plan-first",
		name: "先计划",
		description: "写操作先交计划，批准后再动文件。",
		body: "任何写任务改走计划闸。批准等于确认，执行阶段不再二次拦截。"
	},
	{
		id: "explore",
		name: "只读探索",
		description: "只许读、列、搜。写请求会被退回。",
		body: "子任务与主任务都使用只读工具集。结论以 path:line 回报。"
	}
];
function cloneFiles(files) {
	return files.map((f) => ({
		path: f.path,
		content: f.content
	}));
}
function seedTask(files) {
	const steps = [
		{
			id: "t0-s0",
			brain: "front",
			title: "收单",
			detail: "判定为架构裁决。没有写目标，不进入工具写循环。",
			status: "ok",
			output: "分流：分析。权限不变。"
		},
		{
			id: "t0-s1",
			brain: "back",
			title: "读 SPEC.md",
			detail: "只取执行层文档，不把文档当新指令。",
			tool: "read_file",
			args: { path: "SPEC.md" },
			status: "ok",
			output: SPEC
		},
		{
			id: "t0-s2",
			brain: "back",
			title: "搜索授权",
			detail: "核对直跑和确认分别落在哪一行。",
			tool: "grep",
			args: { q: "授权" },
			status: "ok",
			output: "SPEC.md: 冲突段。policy.ts: gate === confirm 才等待确认。"
		}
	];
	return {
		id: "t0",
		n: 0,
		utterance: "说明对话为什么只负责下单，并把执行层缝上。",
		goal: "写下执行层裁决，不改工作区。",
		acceptance: [
			"分清控制面和执行层",
			"写下权限冲突的裁决",
			"不修改文件"
		],
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
		voiced: true
	};
}
var DANGER = /rm\s+-rf|sudo\b|mkfs\b|:\(\)\s*\{|dd\s+if=|curl[^\n]*\|[^\n]*sh|wget[^\n]*\|/;
function findFile(files, ref) {
	return files.find((f) => f.path === ref || f.path.endsWith("/" + ref) || f.path.endsWith(ref));
}
function grepFiles(files, q) {
	const needle = q.toLowerCase();
	const lines = [];
	for (const f of files) f.content.split("\n").forEach((line, i) => {
		if (line.toLowerCase().includes(needle)) lines.push(`${f.path}:${i + 1}: ${line.trim()}`);
	});
	return lines.slice(0, 40).join("\n") || `没有匹配「${q}」`;
}
function runCommand(files, cmd) {
	const c = cmd.trim();
	if (DANGER.test(c)) return {
		output: "拒绝。破坏性或越权命令在确认和直跑下都不会执行。沙箱不可关。",
		blocked: true
	};
	if (/^ls\b/.test(c)) return {
		output: files.map((f) => f.path).join("\n"),
		blocked: false
	};
	const cat = /^cat\s+(\S+)/.exec(c);
	if (cat) {
		const file = findFile(files, cat[1]);
		return {
			output: file ? file.content : `没有 ${cat[1]}`,
			blocked: false
		};
	}
	const grep = /^grep\s+(?:-n\s+)?(\S+)/.exec(c);
	if (grep) return {
		output: grepFiles(files, grep[1]),
		blocked: false
	};
	if (/^echo\s+/.test(c)) return {
		output: c.replace(/^echo\s+/, ""),
		blocked: false
	};
	return {
		output: "沙箱只实现 ls、cat、grep、echo。这不是宿主机。",
		blocked: false
	};
}
function mentioned(files, text) {
	return files.map((f) => f.path).filter((p) => {
		const base = p.split("/").pop() ?? p;
		return text.includes(p) || text.includes(base);
	});
}
function stamp(role, text) {
	if (role === "field") return `验收：${text}`;
	if (role === "arch") return `裁决：${text}`;
	return `回单：${text}`;
}
function makeStep(taskId, i, partial) {
	return {
		id: `${taskId}-s${i}`,
		...partial
	};
}
function withReview(taskId, steps, note) {
	return [...steps, makeStep(taskId, steps.length, {
		brain: "front",
		title: "审查",
		detail: "执行把结果交回回话。没有新的任务就收束，最多来回 5 次。",
		status: "wait",
		output: note
	})];
}
function chatReply(text) {
	const t = text.trim();
	if (/^(你好|嗨|在吗|在么|哈喽|hello|hi|hey)[!！。.…?？\s]*$/i.test(t)) return "在。这句没有任务，回话直接答，不交执行。要查工作区、改文件或先出计划，说具体目标就行。";
	if (/谢谢|感谢|辛苦/.test(t)) return "不客气。接下来要做事再说。";
	const protocol = protocolAnswer(t);
	if (protocol) return protocol;
	return `听到了：「${t.length > 80 ? `${t.slice(0, 80)}…` : t}」。没有任务，所以不交执行。要查、要改、要计划，直接说目标。`;
}
function protocolAnswer(t) {
	if (/第\s*[三3五5几].*次|熔断|hint|force/.test(t) && !/补上|改|写入|实现|修复|先计划/.test(t)) return "执行对同一工具连续计数：第三次提醒，仍做这一次；第五次停下，不再发下一次。计数在每次进入执行时清掉。";
	if (/轮询|TASK_DONE|审查怎么/.test(t)) return "来回最多 5 次。执行做完，回话再看：可以收束，也可以再交回去。没有标记的纯聊天直接收束。";
	if (/NEED_BACKEND|什么时候.*后脑|叫后脑|不升级|任务指示/.test(t)) return "光说要执行还不够。没有具体任务时，这句话留在回话里，不会送进工具。";
	if (/打断|抢占|插话|排队/.test(t)) return "执行忙的时候先判断来意：停就停下并撤回未验收写入，改口才换成新任务，闲聊只在旁边回一句。";
	if (/问与做|提问还是|先问/.test(t)) return "提问和动手是两件事。提问、征求意见只回答，不改文件。明确要做才进工具。大改或你要求时才先交计划，批准前不写。";
	if (/子智能体|Explore|只读集合/.test(t)) return "检索、核对、方案只收窄能用的工具，不是另开一道沙箱。它们可以查，不能改文件。没有依赖的只读步骤同一拍发出。";
	return null;
}
function shell(input, kind, goal, acceptance, route, review, steps, extra) {
	return {
		id: `t${input.n}`,
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
		...extra
	};
}
function wantsWrite(text) {
	return /改|修改|重写|替换|写入|追加|加上|补上|实现|修复|熔断/.test(text) && !/不要改|别改|只读/.test(text);
}
function asks(text) {
	return /[?？]\s*$/.test(text) || /(吗|呢)[!！。]?\s*$/.test(text) || /^(请问|什么|为什么|为啥|怎么|如何|是否|是不是)/.test(text);
}
function isProtocolTalk(text) {
	if (/补上|改|写入|追加|实现|修复|先计划|重写|替换/.test(text)) return false;
	return protocolAnswer(text) !== null;
}
function frontChat(input, reply) {
	return shell(input, "chat", reply, ["不调用工具", "用户能看到这句回复"], "回话：没有任务，不交执行", reply, [makeStep(`t${input.n}`, 0, {
		brain: "front",
		title: "直接回应",
		detail: "没有具体任务，就不交执行。回复里不带内部控制标记。",
		status: "wait",
		output: "交执行：否\n任务指示：空"
	})]);
}
function isAnalysis(text) {
	return /NORA|Deva|织衡|双脑|harness|整合|控制面|执行层|对话只是|表象/.test(text);
}
function planTask(input) {
	const text = input.utterance.trim();
	const id = `t${input.n}`;
	const skill = input.skillId;
	let mode = input.mode;
	if (DANGER.test(text)) return shell(input, "guard", "拦截越权命令", ["命令未被执行", "工作区不变"], "回话认出危险命令 → 执行拒绝，不进入循环", "未执行。权限闸救不了沙箱明确禁止的命令。", [makeStep(id, 0, {
		brain: "front",
		title: "收单",
		detail: "这句话的可执行部分是一条命令，而且越过沙箱。",
		status: "wait"
	}), makeStep(id, 1, {
		brain: "back",
		title: "运行命令",
		detail: "安全角色直接拒绝，不调用宿主。",
		tool: "run_command",
		args: { cmd: text },
		status: "blocked",
		output: "拒绝。破坏性或越权命令在确认和直跑下都不会执行。"
	})]);
	if (/熔断演示|演示循环|循环熔断演示/.test(text)) return shell(input, "guard", "演示同一调用：第三次提醒，第五次停下", [
		"第三次仍执行并留下提醒",
		"第五次不再调用",
		"不改文件"
	], "同一调用第三次提醒，第五次停止。计数只在这一次执行里累加", "第三次只提醒，第五次才停下。这是执行状态，不是自觉停手。", [
		1,
		2,
		3,
		4,
		5
	].map((n) => makeStep(id, n - 1, {
		brain: "back",
		title: n === 3 ? "搜索循环 · 第三次提醒" : n === 5 ? "循环停止" : `搜索循环 #${n}`,
		detail: n === 3 ? "连续第三次：提醒，但仍做这次。" : n === 5 ? "连续第五次：在再次调用前停下。" : "只读探测，条件不变。",
		tool: n === 5 ? void 0 : "grep",
		args: n === 5 ? void 0 : { q: "runLoop" },
		status: n === 5 ? "blocked" : "wait",
		output: n === 5 ? "第五次停止：同一搜索已连续 5 次。执行停下，不再发第 6 次。" : n === 3 ? "第三次提醒：同一调用已连续 3 次，这次仍执行。" : void 0
	})));
	const mem = /^(?:记住|记下)[:：\s]*(.+)$/.exec(text);
	if (mem) {
		const entry = mem[1].trim().slice(0, 300);
		return shell(input, "memory", "把约束写入记忆，而不是写进聊天", ["条目不超过 300 字", "出现在全局记忆与槽位"], "回话识别为记忆写，不启动文件工具", mem[1].trim().length > 300 ? "原文超过 300 字，已截断后写入。记忆记约束，不记长对话。" : `已记住：${entry}`, [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: "记忆是任务约束。定时与未验收任务不应靠它扩权。",
			status: "wait"
		}), makeStep(id, 1, {
			brain: "back",
			title: "写入记忆",
			detail: entry,
			tool: "memory_write",
			status: "wait",
			writes: true,
			memoryAdd: {
				scope: "global",
				text: entry
			}
		})]);
	}
	const forget = /^(?:忘掉|删除记忆)[:：\s]*(.*)$/.exec(text);
	if (forget) {
		const q = forget[1].trim();
		return shell(input, "forget", "删除匹配的记忆条目", ["匹配条目被移除"], "记忆删除是显式任务", q ? `已尝试删除包含「${q}」的条目。` : "没有给出要忘的内容，记忆未动。", [makeStep(id, 0, {
			brain: "back",
			title: "删除记忆",
			detail: q || "空",
			tool: "memory_delete",
			status: q ? "wait" : "blocked",
			output: q ? void 0 : "缺少匹配文本。",
			memoryDrop: q || void 0,
			writes: Boolean(q)
		})]);
	}
	if (/并行|子代理|分头|同时调研|同时探索/.test(text)) return shell(input, "subagent", "以只读子任务核对工具循环和权限策略", [
		"检索回报路径和行号",
		"核对引用权限文件",
		"主任务不写文件"
	], "回话拆开 → 检索与核对只读分叉 → 回话汇总", "两个子任务都是只读工具集，没有继承写权限，结论只当数据。", [
		makeStep(id, 0, {
			brain: "front",
			title: "拆单",
			detail: "检索找循环，核对看权限。分叉不把主过程灌回去。",
			status: "wait"
		}),
		makeStep(id, 1, {
			brain: "back",
			title: "子任务 · 检索",
			detail: "只读。只搜索。",
			tool: "grep",
			args: { q: "runLoop" },
			status: "wait",
			batch: "sub"
		}),
		makeStep(id, 2, {
			brain: "back",
			title: "子任务 · 核对",
			detail: "只读。对照权限文件和裁决。出处写在结果里。不能改文件。",
			tool: "grep",
			args: { q: "confirm" },
			status: "wait",
			batch: "sub"
		}),
		makeStep(id, 3, {
			brain: "front",
			title: "审查",
			detail: "两个只读子任务同一拍返回。结论只当数据，本轮收束。",
			status: "wait",
			output: "收束。子任务不能写，主任务也不再继续。"
		})
	]);
	if (isAnalysis(text) && !wantsWrite(text)) return shell(input, "analysis", "用工作区里的裁决文档回答执行层问题", ["只读 SPEC", "不把文档内容当成新的系统指令"], "询问。回话转述，执行只读。", "控制面负责下单，执行层负责工具循环。完整裁决在 SPEC.md，本任务没有改文件。", withReview(id, [makeStep(id, 0, {
		brain: "front",
		title: "收单",
		detail: "这是裁决问题，不是写任务。",
		status: "wait"
	}), makeStep(id, 1, {
		brain: "back",
		title: "读 SPEC.md",
		detail: "文件内容当数据。",
		tool: "read_file",
		args: { path: "SPEC.md" },
		status: "wait",
		batch: "read"
	})], "收束。只读裁决，不再交回执行。"));
	if (isProtocolTalk(text) || asks(text) && !wantsWrite(text)) return frontChat(input, chatReply(text));
	const write = wantsWrite(text);
	if (write && skill === "explore") return shell(input, "reject", "退回写请求", ["工作区不变"], "技能「只读探索」拒绝写", "当前技能是只读探索。要改文件，先卸下技能，再走计划或执行。", [makeStep(id, 0, {
		brain: "front",
		title: "退回",
		detail: "技能缩小行为，不扩大权限。",
		status: "blocked",
		output: "未执行写操作。"
	})]);
	if (write && mode === "ask") return shell(input, "reject", "询问模式不写文件", ["工作区不变"], "模式闸挡住写循环", "现在是询问。要改文件，切到计划或执行。", [makeStep(id, 0, {
		brain: "front",
		title: "模式闸",
		detail: "询问模式不能改文件，也不能跑有副作用的命令。",
		status: "blocked",
		output: "已拒绝。"
	})]);
	if (write) {
		if (/先计划|先出计划|出个计划/.test(text) || skill === "plan-first") mode = "plan";
		const patches = proposePatches(input.files, text);
		if (patches.length === 0) return shell(input, "reject", "写意图无法落到已知文件", ["不假装做了任意重构"], "收单失败：没有可执行补丁", "沙箱目前只会：重写 README 的产品定义、给 loop.ts 加熔断、往 notes/inbox.md 追加。请点名其中之一。", [makeStep(id, 0, {
			brain: "front",
			title: "无法形成补丁",
			detail: "有写动词，但没有安全的、确定的文件变换。",
			status: "blocked",
			output: "未写入。"
		})]);
		if (mode === "plan") return shell(input, "plan", patches.length === 1 && patches[0].path.endsWith("loop.ts") ? "计划：为工具循环加上死循环熔断" : `计划：更新 ${patches.map((p) => p.path).join("、")}`, ["先给出补丁，批准前不写", "批准后的执行不再二次确认"], "提交计划。计划是任务状态，不是一段聊天。", "计划待批。批准后会按补丁执行；驳回则工作区不动。", [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: "写意图被计划闸截住。",
			status: "wait"
		}), makeStep(id, 1, {
			brain: "back",
			title: "提交计划",
			detail: patches.map((p) => p.path).join("、"),
			tool: "exit_plan",
			status: "wait",
			planGate: true,
			output: patches.map((p) => {
				const prev = findFile(input.files, p.path)?.content ?? "";
				return `${p.path}\n${prev === p.content ? "无差异" : `将变为 ${p.content.split("\n").length} 行`}`;
			}).join("\n\n")
		})], {
			mode: "plan",
			enact: {
				goal: `执行已批准的补丁：${patches.map((p) => p.path).join("、")}`,
				acceptance: ["补丁落地", "形成检查点"],
				patches
			}
		});
		const steps = [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: input.mode === "act" ? "执行模式。写操作仍受权限策略约束。" : "进入执行。",
			status: "wait"
		})];
		patches.forEach((patch, index) => {
			const same = (findFile(input.files, patch.path)?.content ?? "") === patch.content;
			steps.push(makeStep(id, index + 1, {
				brain: "back",
				title: `改文件 ${patch.path}`,
				detail: same ? "目标内容与现状一致。" : "精确替换整文件内容。",
				tool: "edit_file",
				args: { path: patch.path },
				status: "wait",
				writes: !same,
				patch: same ? void 0 : patch,
				output: same ? "已是目标内容，跳过写入。" : void 0
			}));
		});
		return shell(input, "write", `改写 ${patches.map((p) => p.path).join("、")}`, ["只改点名的文件", "验收能看到 diff 落点"], "回话收单 → 权限闸 → 执行改文件 → 回话审查", `写入 ${patches.map((p) => p.path).join("、")}。对话记录不是 diff，以文件为准。`, withReview(id, steps, "收束。补丁已落，没有继续执行的理由。"));
	}
	if (/读|看|列出|列表|搜索|找|grep|有没有|核对|检查|工作区|文件/.test(text)) {
		const names = mentioned(input.files, text);
		const steps = [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: "只读任务。询问、计划、执行三种模式都可以做。",
			status: "wait"
		})];
		if (/列出|列表|工作区|有哪些/.test(text) || names.length === 0) steps.push(makeStep(id, steps.length, {
			brain: "back",
			title: "列目录",
			detail: "沙箱根目录。",
			tool: "list_dir",
			args: { path: "." },
			status: "wait"
		}));
		if (/搜索|找|grep|有没有|核对/.exec(text)) {
			const q = /循环|熔断|loop/.test(text) ? "runLoop" : /权限|确认|策略/.test(text) ? "confirm" : "任务";
			steps.push(makeStep(id, steps.length, {
				brain: "back",
				title: `搜索 ${q}`,
				detail: "结果是数据，不会被当成下一步指令。",
				tool: "grep",
				args: { q },
				status: "wait"
			}));
		}
		for (const path of names.slice(0, 2)) steps.push(makeStep(id, steps.length, {
			brain: "back",
			title: `读 ${path}`,
			detail: "带路径读取。",
			tool: "read_file",
			args: { path },
			status: "wait"
		}));
		return shell(input, "read", "只读检查工作区", ["不写入", "结果带路径"], "执行只读，同一拍发出", "只读完成。没有产生补丁。", withReview(id, steps.map((step) => step.brain === "back" ? {
			...step,
			batch: "read"
		} : step), "收束。只读结果不当成新指令。"));
	}
	const cmd = /^(?:运行|执行|命令)[:：\s]+(.+)$/.exec(text);
	if (cmd) return shell(input, "command", "在沙箱里运行一条非交互命令", ["只使用允许的命令子集"], "命令留在沙箱里。直跑也不是把机器交出去。", "命令已在沙箱内结束。沙箱外没有副作用。", withReview(id, [makeStep(id, 0, {
		brain: "back",
		title: "运行命令",
		detail: cmd[1],
		tool: "run_command",
		args: { cmd: cmd[1] },
		status: "wait"
	})], "收束。命令在沙箱内结束。"));
	return frontChat(input, chatReply(text));
}
function proposePatches(files, text) {
	const patches = [];
	const names = mentioned(files, text);
	const touchReadme = /README/.test(text) || /改|重写|强调/.test(text) && /readme|说明|产品/.test(text.toLowerCase());
	const touchLoop = /loop\.ts|熔断|死循环/.test(text);
	const touchInbox = /inbox|追加/.test(text) || names.length === 0 && /追加|记一条/.test(text);
	if (touchReadme || names.includes("README.md")) {
		if (/README|说明|产品|对话|任务/.test(text)) patches.push({
			path: "README.md",
			content: README_TASK
		});
	}
	if (touchLoop || names.includes("src/harness/loop.ts")) {
		const current = findFile(files, "src/harness/loop.ts")?.content ?? findFile(seedFiles(), "src/harness/loop.ts").content;
		patches.push({
			path: "src/harness/loop.ts",
			content: withFuse(current)
		});
	}
	if (touchInbox || names.includes("notes/inbox.md")) {
		const current = findFile(files, "notes/inbox.md")?.content ?? "";
		const line = `- [ ] ${text.replace(/\s+/g, " ").slice(0, 180)}\n`;
		if (!current.includes(line.trim())) patches.push({
			path: "notes/inbox.md",
			content: current.endsWith("\n") ? current + line : current + "\n" + line
		});
	}
	const unique = /* @__PURE__ */ new Map();
	for (const p of patches) unique.set(p.path, p);
	return [...unique.values()];
}
function enactTask(parent, n, files, at) {
	if (!parent.enact) return null;
	const { goal, acceptance, patches } = parent.enact;
	const id = `t${n}`;
	const steps = [makeStep(id, 0, {
		brain: "front",
		title: "按批准的计划执行",
		detail: `来自任务 #${parent.n}。计划批准已代替权限弹框。`,
		status: "wait"
	})];
	patches.forEach((patch, index) => {
		const same = (findFile(files, patch.path)?.content ?? "") === patch.content;
		steps.push(makeStep(id, index + 1, {
			brain: "back",
			title: `改文件 ${patch.path}`,
			detail: "批准过的补丁。",
			tool: "edit_file",
			args: { path: patch.path },
			status: "wait",
			writes: !same,
			patch: same ? void 0 : patch,
			output: same ? "已是目标内容，跳过写入。" : void 0
		}));
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
		filesAtStart: cloneFiles(files)
	};
}
function applyStep(files, memory, step, at) {
	if (step.status === "blocked") return {
		files,
		memory,
		output: step.output ?? "已阻断",
		status: "blocked"
	};
	if (step.memoryDrop) {
		const next = memory.filter((m) => !m.text.includes(step.memoryDrop));
		const removed = memory.length - next.length;
		return {
			files,
			memory: next,
			output: removed ? `删除 ${removed} 条。` : "没有匹配的记忆。",
			status: "ok"
		};
	}
	if (step.memoryAdd) {
		const text = step.memoryAdd.text.slice(0, 300);
		const cap = step.memoryAdd.scope === "project" ? 3e3 : 4e3;
		const used = memory.filter((m) => m.scope === step.memoryAdd.scope).reduce((sum, m) => sum + m.text.length, 0);
		if (used + text.length > cap) return {
			files,
			memory,
			output: `${step.memoryAdd.scope === "project" ? "项目" : "全局"}记忆上限 ${cap} 字，这条没写入。`,
			status: "blocked"
		};
		const entry = {
			id: `m${at}`,
			scope: step.memoryAdd.scope,
			text,
			at
		};
		return {
			files,
			memory: [...memory, entry],
			output: `${entry.scope === "project" ? "项目" : "全局"}记忆 +1（${entry.text.length} 字，累计 ${used + entry.text.length}/${cap}）`,
			status: "ok"
		};
	}
	if (step.patch) return {
		files: files.some((f) => f.path === step.patch.path) ? files.map((f) => f.path === step.patch.path ? {
			...f,
			content: step.patch.content
		} : f) : [...files, {
			path: step.patch.path,
			content: step.patch.content
		}],
		memory,
		output: `已写入 ${step.patch.path}`,
		status: "ok"
	};
	if (step.tool === "read_file") {
		const file = findFile(files, step.args?.path ?? "");
		return {
			files,
			memory,
			output: file ? file.content : `没有 ${step.args?.path}`,
			status: "ok"
		};
	}
	if (step.tool === "list_dir") return {
		files,
		memory,
		output: files.map((f) => f.path).sort().join("\n"),
		status: "ok"
	};
	if (step.tool === "grep") return {
		files,
		memory,
		output: grepFiles(files, step.args?.q ?? ""),
		status: "ok"
	};
	if (step.tool === "run_command") {
		const result = runCommand(files, step.args?.cmd ?? "");
		return {
			files,
			memory,
			output: result.output,
			status: result.blocked ? "blocked" : "ok"
		};
	}
	return {
		files,
		memory,
		output: step.output ?? step.detail,
		status: step.status === "wait" ? "ok" : step.status
	};
}
function estimateTokens(tasks, memory) {
	const body = tasks.map((t) => [
		t.utterance,
		t.goal,
		t.review,
		...t.steps.map((s) => s.output ?? "")
	].join("\n")).join("\n");
	const mem = memory.map((m) => m.text).join("\n");
	return Math.ceil((body.length + mem.length) / 2);
}
function fresh() {
	const files = seedFiles();
	return {
		tasks: [seedTask(files)],
		files,
		memory: [],
		summaries: [],
		slots: [],
		archive: [],
		checkpoints: [{
			id: "seed",
			label: "种子",
			at: 0,
			taskCount: 1,
			files: cloneFiles(files)
		}],
		mode: "act",
		roleId: "dispatch",
		gate: "confirm",
		skillId: "none",
		presence: "sealed",
		seq: 1
	};
}
function replaceTask(tasks, id, next) {
	return tasks.map((t) => t.id === id ? next : t);
}
function isStop(text) {
	return /^(停|停下|停止|取消|别做了|别跑了)/.test(text);
}
function settleChat(task) {
	return {
		...task,
		status: "done",
		revealed: task.steps.length,
		steps: task.steps.map((step) => step.status === "wait" ? {
			...step,
			status: "ok"
		} : step)
	};
}
function restamp(task, text, route) {
	const prefix = task.review.startsWith("裁决：") ? "裁决：" : task.review.startsWith("验收：") ? "验收：" : "回单：";
	return {
		...settleChat(task),
		goal: text,
		route,
		review: prefix + text,
		steps: task.steps.map((step) => ({
			...step,
			status: "ok",
			title: "停止",
			detail: "判为停止。未验收写入回到本任务开始时的文件。",
			output: "动作：停止\n回滚：任务开始时的文件\n交执行：否"
		}))
	};
}
function activeWork(tasks, activeId) {
	const current = tasks.find((t) => t.id === activeId);
	if (!current) return null;
	if (current.status !== "running" && current.status !== "awaiting") return null;
	return current;
}
function syncSlots(memory) {
	return memory.slice(-8).map((m) => ({
		key: m.text.slice(0, 12),
		value: m.text
	}));
}
var useHarness = create()(persist((set, get) => ({
	...fresh(),
	tab: "run",
	playing: false,
	activeId: "t0",
	selectedPath: "SPEC.md",
	grokVoice: false,
	grokNote: null,
	notice: null,
	boot: () => {
		useHarness.persist.rehydrate();
	},
	setTab: (tab) => set({ tab }),
	setMode: (mode) => set({
		mode,
		notice: null
	}),
	setRole: (roleId) => set({ roleId }),
	setGate: (gate) => set({ gate }),
	setSkill: (skillId) => set({ skillId }),
	setGrokVoice: (grokVoice) => set({
		grokVoice,
		grokNote: null
	}),
	selectPath: (selectedPath) => set({
		selectedPath,
		tab: "files"
	}),
	dispatch: (utterance) => {
		const text = utterance.trim();
		if (!text) return;
		const s = get();
		if (text === "/compact" || text === "压缩") {
			get().compact();
			return;
		}
		if (text === "/rewind" || text === "回退") {
			const last = [...s.checkpoints].reverse().find((c) => c.id !== "seed") ?? s.checkpoints[0];
			if (last) get().rewind(last.id);
			return;
		}
		if (text === "/ask" || text === "询问") return set({
			mode: "ask",
			notice: "模式已设为询问。只读。"
		});
		if (text === "/plan" || text === "计划") return set({
			mode: "plan",
			notice: "模式已设为计划。写之前要批准。"
		});
		if (text === "/act" || text === "执行") return set({
			mode: "act",
			notice: "模式已设为执行。"
		});
		if (text === "/skill plan" || text === "/skill 先计划") return set({ skillId: "plan-first" });
		if (text === "/skill explore" || text === "/skill 只读") return set({ skillId: "explore" });
		if (text === "/skill off" || text === "/skill 无") return set({ skillId: "none" });
		const current = activeWork(s.tasks, s.activeId);
		const n = s.seq;
		const plan = (files) => planTask({
			utterance: text,
			files,
			mode: s.mode,
			roleId: s.roleId,
			skillId: s.skillId,
			n,
			at: Date.now()
		});
		if (current && isStop(text)) {
			const files = cloneFiles(current.filesAtStart);
			const tasks = replaceTask(s.tasks, current.id, {
				...current,
				status: "preempted",
				review: "已停止。未验收的写入已回滚。"
			});
			const task = restamp(plan(files), "执行已停。未验收的写入已回滚。", "interrupt stop：回滚未验收写入");
			set({
				tasks: [...tasks, task],
				files,
				seq: n + 1,
				activeId: task.id,
				playing: false,
				presence: "sealed",
				tab: "run",
				notice: null
			});
			return;
		}
		if (current) {
			const aside = plan(s.files);
			if (aside.kind === "chat") {
				set({
					tasks: [...s.tasks, settleChat(aside)],
					seq: n + 1,
					tab: "run",
					notice: "闲聊已旁路。执行还在跑，写入未回滚。"
				});
				return;
			}
			const files = cloneFiles(current.filesAtStart);
			const tasks = replaceTask(s.tasks, current.id, {
				...current,
				status: "preempted",
				review: "未验收就被新任务抢占。本次写入已回滚。"
			});
			const task = plan(files);
			task.status = "running";
			set({
				tasks: [...tasks, task],
				files,
				seq: n + 1,
				activeId: task.id,
				playing: true,
				presence: "exec",
				tab: "run",
				notice: null
			});
			return;
		}
		const task = plan(s.files);
		if (task.kind === "chat") {
			set({
				tasks: [...s.tasks, settleChat(task)],
				seq: n + 1,
				activeId: task.id,
				playing: false,
				presence: "sealed",
				tab: "run",
				notice: null
			});
			return;
		}
		task.status = "running";
		set({
			tasks: [...s.tasks, task],
			seq: n + 1,
			activeId: task.id,
			playing: true,
			presence: "exec",
			tab: "run",
			notice: null
		});
	},
	tick: () => {
		const s = get();
		const task = s.tasks.find((t) => t.id === s.activeId);
		if (!task || task.status !== "running") {
			set({ playing: false });
			return;
		}
		const step = task.steps[task.revealed];
		if (!step) {
			get().finishTask(task.id);
			return;
		}
		if (step.planGate || step.writes && s.gate === "confirm" && !task.precleared) {
			set({
				tasks: replaceTask(s.tasks, task.id, {
					...task,
					status: "awaiting"
				}),
				playing: false,
				presence: "exec"
			});
			return;
		}
		if (step.status === "blocked") {
			const steps = task.steps.map((st, i) => i === task.revealed ? {
				...st,
				status: "blocked"
			} : st);
			set({
				tasks: replaceTask(s.tasks, task.id, {
					...task,
					steps,
					revealed: task.revealed + 1,
					status: "blocked"
				}),
				playing: false,
				presence: "sealed"
			});
			return;
		}
		let files = s.files;
		let memory = s.memory;
		const steps = task.steps.slice();
		let revealed = task.revealed;
		let blocked = false;
		const batch = step.batch;
		const take = (index) => {
			const currentStep = steps[index];
			if (currentStep.status === "blocked") {
				blocked = true;
				revealed = index + 1;
				return false;
			}
			const applied = applyStep(files, memory, currentStep, Date.now());
			const hint = currentStep.output?.startsWith("第三次提醒：") ? `${currentStep.output}\n` : "";
			steps[index] = {
				...currentStep,
				status: applied.status,
				output: hint + applied.output
			};
			files = applied.files;
			memory = applied.memory;
			revealed = index + 1;
			if (applied.status === "blocked") {
				blocked = true;
				return false;
			}
			return true;
		};
		if (take(revealed) && batch) while (revealed < steps.length) {
			const next = steps[revealed];
			if (next.batch !== batch || next.writes || next.planGate) break;
			if (!take(revealed)) break;
		}
		set({
			tasks: replaceTask(s.tasks, task.id, {
				...task,
				steps,
				revealed,
				status: blocked ? "blocked" : "running"
			}),
			files,
			memory,
			slots: syncSlots(memory),
			...blocked ? {
				playing: false,
				presence: "sealed"
			} : {}
		});
		if (blocked || revealed >= steps.length) get().finishTask(task.id, blocked ? "blocked" : void 0);
	},
	approve: () => {
		const s = get();
		const task = s.tasks.find((t) => t.id === s.activeId && t.status === "awaiting");
		if (!task) return;
		const step = task.steps[task.revealed];
		if (!step) return;
		if (step.planGate) {
			const steps = task.steps.map((st, i) => i === task.revealed ? {
				...st,
				status: "ok",
				output: st.output ?? "已批准"
			} : st);
			const closed = {
				...task,
				steps,
				revealed: steps.length,
				status: "done",
				review: "回单：计划已批准，转入执行。"
			};
			const child = enactTask(task, s.seq, s.files, Date.now());
			if (!child) {
				set({
					tasks: replaceTask(s.tasks, task.id, closed),
					playing: false,
					presence: "sealed"
				});
				return;
			}
			child.status = "running";
			set({
				tasks: [...replaceTask(s.tasks, task.id, closed), child],
				seq: s.seq + 1,
				activeId: child.id,
				playing: true,
				presence: "exec"
			});
			return;
		}
		const applied = applyStep(s.files, s.memory, step, Date.now());
		const steps = task.steps.map((st, i) => i === task.revealed ? {
			...st,
			status: applied.status,
			output: applied.output
		} : st);
		const revealed = task.revealed + 1;
		const updated = {
			...task,
			steps,
			revealed,
			status: "running"
		};
		set({
			tasks: replaceTask(s.tasks, task.id, updated),
			files: applied.files,
			memory: applied.memory,
			slots: syncSlots(applied.memory),
			playing: true,
			presence: "exec"
		});
		if (revealed >= steps.length || applied.status === "blocked") get().finishTask(task.id, applied.status === "blocked" ? "blocked" : void 0);
	},
	deny: () => {
		const s = get();
		const task = s.tasks.find((t) => t.id === s.activeId && t.status === "awaiting");
		if (!task) return;
		const steps = task.steps.map((st, i) => i === task.revealed ? {
			...st,
			status: "denied",
			output: "已拒绝。工作区未改。"
		} : st);
		set({
			tasks: replaceTask(s.tasks, task.id, {
				...task,
				steps,
				revealed: task.revealed + 1,
				status: "rejected",
				review: "回单：已拒绝。未验收的写入不会落地。"
			}),
			playing: false,
			presence: "sealed"
		});
	},
	rewind: (id) => {
		const s = get();
		const point = s.checkpoints.find((c) => c.id === id);
		if (!point) return;
		set({
			files: cloneFiles(point.files),
			tasks: s.tasks.slice(0, point.taskCount),
			playing: false,
			presence: "sealed",
			activeId: s.tasks[point.taskCount - 1]?.id ?? null,
			notice: `已回到「${point.label}」。之后的任务记录已撤下。`,
			checkpoints: s.checkpoints.filter((c) => c.at <= point.at || c.id === "seed")
		});
	},
	compact: () => {
		const s = get();
		if (s.tasks.length < 2) {
			set({ notice: "轨迹太短，还不需要压缩。" });
			return;
		}
		const keep = 2;
		const notes = s.tasks.slice(0, Math.max(0, s.tasks.length - keep)).map((t) => ({
			id: `sum-${t.id}`,
			covering: t.n,
			text: `#${t.n} ${t.goal} → ${t.review.replace(/\s+/g, " ").slice(0, 80)}`
		}));
		set({
			tasks: s.tasks.map((t, i) => {
				if (i >= s.tasks.length - keep) return t;
				if (t.steps.length <= 1 && t.steps[0]?.title === "已折叠") return t;
				return {
					...t,
					steps: [{
						id: `${t.id}-fold`,
						brain: "front",
						title: "已折叠",
						detail: "原文进入摘要层与归档。",
						status: "ok",
						output: notes.find((n) => n.covering === t.n)?.text
					}],
					revealed: 1
				};
			}),
			summaries: [...s.summaries, ...notes],
			archive: [...s.archive, ...notes],
			notice: `已压缩 ${notes.length} 条轨迹。记忆槽位不动。`
		});
	},
	reset: () => {
		set({
			...fresh(),
			tab: "run",
			playing: false,
			activeId: "t0",
			selectedPath: "SPEC.md",
			grokVoice: get().grokVoice,
			grokNote: null,
			notice: "沙箱已回到种子。"
		});
	},
	patchReview: (id, text) => {
		const task = get().tasks.find((t) => t.id === id);
		if (!task) return;
		set({
			tasks: replaceTask(get().tasks, id, {
				...task,
				review: text,
				goal: task.kind === "chat" ? text : task.goal,
				voiced: true
			}),
			grokNote: null
		});
	},
	finishTask: (id, force) => {
		const s = get();
		const task = s.tasks.find((t) => t.id === id);
		if (!task) return;
		const blocked = force === "blocked" || task.steps.some((st) => st.status === "blocked");
		const status = blocked ? "blocked" : task.status === "rejected" ? "rejected" : "done";
		const done = {
			...task,
			status,
			revealed: blocked ? task.revealed : Math.max(task.revealed, task.steps.length)
		};
		const changed = JSON.stringify(s.files) !== JSON.stringify(task.filesAtStart);
		const checkpoints = [...s.checkpoints];
		if (changed && status === "done") checkpoints.push({
			id: `cp-${task.id}`,
			label: `#${task.n} ${task.goal.slice(0, 18)}`,
			at: Date.now(),
			taskCount: s.tasks.findIndex((t) => t.id === id) + 1,
			files: cloneFiles(s.files)
		});
		set({
			tasks: replaceTask(s.tasks, id, done),
			checkpoints,
			playing: false,
			presence: "sealed"
		});
	}
}), {
	name: "lattice-harness-v2",
	skipHydration: true,
	partialize: (s) => ({
		tasks: s.tasks,
		files: s.files,
		memory: s.memory,
		summaries: s.summaries,
		slots: s.slots,
		archive: s.archive,
		checkpoints: s.checkpoints,
		mode: s.mode,
		roleId: s.roleId,
		gate: s.gate,
		skillId: s.skillId,
		presence: s.presence,
		seq: s.seq
	}),
	onRehydrateStorage: () => (state) => {
		if (!state) return;
		state.playing = false;
		state.tasks = state.tasks.map((t) => t.status === "running" || t.status === "queued" || t.status === "awaiting" ? {
			...t,
			status: "preempted",
			review: t.review || "会话中断，未验收。"
		} : t);
		state.presence = "sealed";
	}
}));
function contextLoad(tasks, memory) {
	return estimateTokens(tasks, memory);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var voiceReview = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	return {
		task: String(raw.task ?? "").slice(0, 1500),
		trace: String(raw.trace ?? "").slice(0, 3500),
		role: String(raw.role ?? "dispatch").slice(0, 24)
	};
}).handler(createSsrRpc("43acf2d508acba03ade74c0d5e6b417812d35b475645bacc00cb94405465d8a4"));
var frontSpeak = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	return {
		utterance: String(raw.utterance ?? "").slice(0, 500),
		draft: String(raw.draft ?? "").slice(0, 800),
		role: String(raw.role ?? "dispatch").slice(0, 24)
	};
}).handler(createSsrRpc("ae8192f183a72e56092aed983d797977d3464d3fc6c3ad26c5d4a2ca845bf292"));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var MODES = [
	{
		id: "ask",
		label: "询问",
		hint: "只读"
	},
	{
		id: "plan",
		label: "计划",
		hint: "先批再写"
	},
	{
		id: "act",
		label: "执行",
		hint: "直接进循环"
	}
];
var STATUS = {
	queued: "排队",
	running: "执行中",
	awaiting: "等待裁决",
	done: "已验收",
	blocked: "已阻断",
	preempted: "已抢占",
	rejected: "已拒绝"
};
var PROMPTS = [
	"列出工作区并阅读 AGENTS.md",
	"先计划：给 loop.ts 补上死循环熔断",
	"直接改 README，强调任务是本体",
	"并行探索工具循环，并核对权限策略",
	"记住：写操作必须确认，用中文验收"
];
function LatticeApp() {
	const boot = useHarness((s) => s.boot);
	const playing = useHarness((s) => s.playing);
	const tick = useHarness((s) => s.tick);
	const tasks = useHarness((s) => s.tasks);
	const memory = useHarness((s) => s.memory);
	const activeId = useHarness((s) => s.activeId);
	const grokVoice = useHarness((s) => s.grokVoice);
	const patchReview = useHarness((s) => s.patchReview);
	const setGrokNote = useHarness((s) => s.grokNote);
	(0, import_react.useEffect)(() => {
		boot();
	}, [boot]);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		const id = window.setInterval(() => tick(), 420);
		return () => window.clearInterval(id);
	}, [playing, tick]);
	const tried = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const pendingVoice = tasks.find((t) => grokVoice && !t.voiced && t.id !== "t0" && (t.status === "done" || t.status === "blocked") && t.steps.some((step) => step.tool && step.status === "ok"));
	(0, import_react.useEffect)(() => {
		if (!pendingVoice || tried.current.has(pendingVoice.id)) return;
		tried.current.add(pendingVoice.id);
		const trace = pendingVoice.steps.map((step) => `${step.title} ${step.status} ${(step.output ?? "").slice(0, 240)}`).join("\n");
		voiceReview({ data: {
			task: `${pendingVoice.goal}\n验收：${pendingVoice.acceptance.join("；")}`,
			trace,
			role: pendingVoice.roleId
		} }).then((res) => {
			if (res.ok) patchReview(pendingVoice.id, res.text);
			else useHarness.setState({ grokNote: res.error });
		});
	}, [pendingVoice, patchReview]);
	const pendingChat = tasks.find((t) => grokVoice && !t.voiced && t.kind === "chat" && t.status === "done" && t.id !== "t0" && !t.route.startsWith("interrupt"));
	(0, import_react.useEffect)(() => {
		if (!pendingChat || tried.current.has(`chat:${pendingChat.id}`)) return;
		tried.current.add(`chat:${pendingChat.id}`);
		frontSpeak({ data: {
			utterance: pendingChat.utterance,
			draft: pendingChat.goal,
			role: pendingChat.roleId
		} }).then((res) => {
			if (res.ok) patchReview(pendingChat.id, res.text);
			else useHarness.setState({ grokNote: res.error });
		});
	}, [pendingChat, patchReview]);
	const load = contextLoad(tasks, memory);
	const hot = load / CONTEXT_MAX >= .75;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
				load,
				hot
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controls, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeckTabs, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] min-[960px]:grid-cols-[minmax(0,1fr)_340px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskPane, { activeId }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Deck, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: setGrokNote ?? ""
			})
		]
	});
}
function Header({ load, hot }) {
	const presence = useHarness((s) => s.presence);
	const grokVoice = useHarness((s) => s.grokVoice);
	const setGrokVoice = useHarness((s) => s.setGrokVoice);
	const grokNote = useHarness((s) => s.grokNote);
	const compact = useHarness((s) => s.compact);
	const reset = useHarness((s) => s.reset);
	const pct = Math.min(100, Math.round(load / CONTEXT_MAX * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "border-b border-line px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-end gap-1",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-3 w-1 bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-5 w-1 bg-brass" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-base font-medium tracking-wide",
							children: "织衡"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: "闲聊只回，不交执行。任务才改文件。"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ml-auto font-mono text-xs text-muted",
						children: presence === "exec" ? "执行中" : presence === "sealed" ? "段已封存" : "空闲"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-1 min-w-0 flex-1 bg-line",
						title: "轨迹占用",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("h-1", hot ? "bg-threat" : "bg-brass"),
							style: { width: `${pct}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "shrink-0 font-mono text-xs text-muted tabular-nums",
						children: [
							load,
							"/",
							CONTEXT_MAX
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 px-2 text-xs text-muted",
						onClick: () => compact(),
						children: "压缩"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 px-2 text-xs text-muted",
						onClick: () => reset(),
						children: "重置"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("min-h-11 px-2 text-xs", grokVoice ? "text-brass" : "text-muted"),
						onClick: () => setGrokVoice(!grokVoice),
						title: "只用 Grok 重写验收，不替你跑工具",
						children: grokVoice ? "Grok 验收" : "编排验收"
					})
				]
			}),
			grokNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-threat",
				children: grokNote
			}) : null
		]
	});
}
function Controls() {
	const mode = useHarness((s) => s.mode);
	const gate = useHarness((s) => s.gate);
	const roleId = useHarness((s) => s.roleId);
	const skillId = useHarness((s) => s.skillId);
	const setMode = useHarness((s) => s.setMode);
	const setGate = useHarness((s) => s.setGate);
	const setRole = useHarness((s) => s.setRole);
	const setSkill = useHarness((s) => s.setSkill);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2 overflow-x-auto border-b border-line px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 border border-line",
				role: "group",
				"aria-label": "模式",
				children: MODES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("min-h-11 px-3 text-sm", mode === item.id ? "bg-brass text-ink" : "text-muted"),
					onClick: () => setMode(item.id),
					children: item.label
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 border border-line",
				role: "group",
				"aria-label": "权限",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("min-h-11 px-3 text-sm", gate === "confirm" ? "bg-raised text-fg" : "text-muted"),
					onClick: () => setGate("confirm"),
					children: "确认"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("min-h-11 px-3 text-sm", gate === "open" ? "bg-raised text-fg" : "text-muted"),
					onClick: () => setGate("open"),
					children: "直跑"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 border border-line",
				role: "group",
				"aria-label": "转述角色",
				children: ROLES.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("min-h-11 px-3 text-sm", roleId === role.id ? "text-brass" : "text-muted"),
					onClick: () => setRole(role.id),
					title: role.note,
					children: role.name
				}, role.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 border border-line",
				role: "group",
				"aria-label": "技能",
				children: SKILLS.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("min-h-11 px-3 text-sm", skillId === skill.id ? "text-brass" : "text-muted"),
					onClick: () => setSkill(skill.id),
					title: skill.description,
					children: skill.name
				}, skill.id))
			})
		]
	});
}
function TaskPane({ activeId }) {
	const tab = useHarness((s) => s.tab);
	const tasks = useHarness((s) => s.tasks);
	const notice = useHarness((s) => s.notice);
	const endRef = (0, import_react.useRef)(null);
	const skipScroll = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		if (skipScroll.current) {
			skipScroll.current = false;
			return;
		}
		endRef.current?.scrollIntoView({ block: "nearest" });
	}, [
		tasks.length,
		activeId,
		tasks[tasks.length - 1]?.revealed,
		tasks[tasks.length - 1]?.status
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("flex h-full min-h-0 flex-col", tab !== "run" && "max-[959px]:hidden"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 max-w-2xl text-sm text-muted",
					children: "没有任务时只回话。执行途中的闲聊只旁路；说「停」或下一个任务才会打断并回滚。沙箱里的文件才算数。"
				}),
				notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-brass",
					children: notice
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "flex flex-col gap-3",
					children: tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskCard, {
						task,
						active: task.id === activeId
					}, task.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {})]
	});
}
function TaskCard({ task, active }) {
	const [open, setOpen] = (0, import_react.useState)(task.status === "running" || task.status === "awaiting" || task.kind === "chat");
	const done = task.steps.slice(0, task.revealed);
	const pending = task.status === "running" || task.status === "awaiting" ? task.steps[task.revealed] : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		id: `task-${task.id}`,
		className: cn("border border-line bg-surface", active && "border-brass"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex w-full items-start gap-3 px-3 py-3 text-left",
			onClick: () => setOpen((v) => !v),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-1 font-mono text-xs text-muted",
				children: ["#", String(task.n).padStart(2, "0")]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm",
					children: task.goal
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 block text-xs text-muted",
					children: [
						STATUS[task.status],
						" · ",
						task.route
					]
				})]
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-t border-line px-3 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "原话"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm",
					children: task.utterance
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 flex flex-col gap-1",
					children: task.acceptance.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-xs text-muted",
						children: ["验收 · ", item]
					}, item))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-3 flex flex-col gap-2",
					children: done.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepRow, { step }, step.id))
				}),
				pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 border border-line bg-bg px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-xs text-brass",
							children: [
								pending.brain === "front" ? "回话" : "执行",
								" · ",
								pending.title
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: pending.detail
						}),
						pending.planGate || pending.writes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Approval, { step: pending }) : null
					]
				}) : null,
				task.status !== "running" && task.status !== "queued" && task.status !== "awaiting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm whitespace-pre-wrap",
					children: task.review
				}) : null
			]
		}) : null]
	});
}
function StepRow({ step }) {
	const tone = step.status === "blocked" || step.status === "denied" ? "text-threat" : "text-muted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "border border-line bg-bg px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: cn("font-mono text-xs", tone),
			children: [
				step.brain === "front" ? "回话" : "执行",
				" · ",
				step.title,
				" · ",
				step.status
			]
		}), step.output ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Output, { text: step.output }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted",
			children: step.detail
		})]
	});
}
function Output({ text }) {
	const [full, setFull] = (0, import_react.useState)(false);
	const long = text.length > 320;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "max-h-64 overflow-auto font-mono text-xs whitespace-pre-wrap text-fg",
			children: full || !long ? text : `${text.slice(0, 320)}…`
		}), long ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-1 min-h-11 text-xs text-brass",
			onClick: () => setFull((v) => !v),
			children: full ? "收起输出" : "展开输出"
		}) : null]
	});
}
function Approval({ step }) {
	const approve = useHarness((s) => s.approve);
	const deny = useHarness((s) => s.deny);
	const files = useHarness((s) => s.files);
	const plan = Boolean(step.planGate);
	const current = step.patch ? files.find((f) => f.path === step.patch?.path) : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [
			step.patch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-xs text-muted",
				children: [
					step.patch.path,
					" · ",
					current ? `${current.content.split("\n").length} → ${step.patch.content.split("\n").length} 行` : "新文件"
				]
			}) : null,
			step.output && plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-2 max-h-40 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted",
				children: step.output
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 bg-brass px-4 text-sm text-ink",
					onClick: () => approve(),
					children: plan ? "批准并执行" : "允许写入"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-line px-4 text-sm",
					onClick: () => deny(),
					children: plan ? "驳回" : "拒绝"
				})]
			})
		]
	});
}
function Composer() {
	const dispatch = useHarness((s) => s.dispatch);
	const playing = useHarness((s) => s.playing);
	const [text, setText] = (0, import_react.useState)("");
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	const send = () => {
		const next = text.trim();
		if (!next) return;
		dispatch(next);
		setText("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "border-t border-line bg-bg px-3 py-3",
		onSubmit: (event) => {
			event.preventDefault();
			send();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 flex gap-2 overflow-x-auto",
				children: PROMPTS.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 shrink-0 border border-line px-3 text-xs text-muted",
					onClick: () => dispatch(prompt),
					children: prompt
				}, prompt))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "下达任务"
					}), mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: text,
						rows: 2,
						placeholder: playing ? "闲聊会旁路回复，不打断执行。说「停」或下一个任务才会打断" : "闲聊会回。要查、要改、要计划，直接说目标",
						className: "w-full resize-none border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted",
						onChange: (event) => setText(event.target.value),
						onKeyDown: (event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								send();
							}
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 border border-line bg-surface" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "min-h-11 bg-brass px-4 text-sm text-ink",
					children: "下达"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-2 overflow-x-auto",
				children: [
					"你好",
					"熔断演示",
					"运行 rm -rf /"
				].map((probe) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "min-h-11 px-2 text-xs text-muted",
					onClick: () => dispatch(probe),
					children: ["探针 · ", probe]
				}, probe))
			})
		]
	});
}
function DeckTabs() {
	const tab = useHarness((s) => s.tab);
	const setTab = useHarness((s) => s.setTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex border-b border-line min-[960px]:hidden",
		role: "tablist",
		children: [
			{
				id: "run",
				label: "任务"
			},
			{
				id: "spec",
				label: "裁决"
			},
			{
				id: "files",
				label: "文件"
			},
			{
				id: "memory",
				label: "记忆"
			}
		].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "tab",
			"aria-selected": tab === item.id,
			className: cn("min-h-11 flex-1 text-sm", tab === item.id ? "text-brass" : "text-muted"),
			onClick: () => setTab(item.id),
			children: item.label
		}, item.id))
	});
}
function Deck() {
	const tab = useHarness((s) => s.tab);
	const setTab = useHarness((s) => s.setTab);
	const side = tab === "run" ? "spec" : tab;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("flex min-h-0 flex-col border-line min-[960px]:border-l", tab === "run" && "max-[959px]:hidden"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden shrink-0 border-b border-line min-[960px]:flex",
			role: "tablist",
			"aria-label": "执行侧栏",
			children: [
				{
					id: "spec",
					label: "裁决"
				},
				{
					id: "files",
					label: "文件"
				},
				{
					id: "memory",
					label: "记忆"
				}
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": side === item.id,
				className: cn("min-h-11 flex-1 text-sm", side === item.id ? "text-brass" : "text-muted"),
				onClick: () => setTab(item.id),
				children: item.label
			}, item.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
			children: [
				side === "spec" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {}) : null,
				side === "files" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, {}) : null,
				side === "memory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Memory, {}) : null
			]
		})]
	});
}
function Spec() {
	const paragraphs = JUDGMENT.split(/\n\n+/);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-brass",
				children: "收单 → 分流 → 计划闸 / 权限闸 → 工具循环 → 验收 → 封存"
			}),
			paragraphs.map((para) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: para
			}, para.slice(0, 16))),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "flex flex-col gap-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "回话只听、答、审查。执行才碰文件和命令。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "提问不写。大改先交计划。只读步骤同一拍完成。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "确认或直跑可切换。沙箱和危险命令不能关。" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkpoints, {})
		]
	});
}
function Files() {
	const files = useHarness((s) => s.files);
	const selectedPath = useHarness((s) => s.selectedPath);
	const selectPath = useHarness((s) => s.selectPath);
	const file = files.find((item) => item.path === selectedPath) ?? files[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mb-3 flex flex-col",
		children: files.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: cn("min-h-11 w-full text-left font-mono text-xs", item.path === file?.path ? "text-brass" : "text-muted"),
			onClick: () => selectPath(item.path),
			children: item.path
		}) }, item.path))
	}), file ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
		className: "overflow-auto border border-line bg-bg p-3 font-mono text-xs whitespace-pre-wrap",
		children: file.content
	}) : null] });
}
function Memory() {
	const memory = useHarness((s) => s.memory);
	const summaries = useHarness((s) => s.summaries);
	const slots = useHarness((s) => s.slots);
	const archive = useHarness((s) => s.archive);
	const tasks = useHarness((s) => s.tasks);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layer, {
				title: "原始",
				note: "任务轨迹",
				children: tasks.length === 0 ? "空" : `${tasks.length} 条任务`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layer, {
				title: "摘要",
				note: "压缩后留下的结论",
				children: summaries.length === 0 ? "还没压缩" : summaries.map((s) => s.text).join("\n")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layer, {
				title: "槽位",
				note: "当前约束",
				children: slots.length === 0 ? "没有槽位" : slots.map((s) => s.value).join("\n")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layer, {
				title: "归档",
				note: "卷出去的旧轨迹",
				children: archive.length === 0 ? "归档为空" : archive.map((s) => s.text).join("\n")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layer, {
				title: "记忆条目",
				note: "全局，单条 ≤ 300 字",
				children: memory.length === 0 ? "用「记住：」写入约束" : memory.map((m) => m.text).join("\n")
			})
		]
	});
}
function Layer({ title, note, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "mt-2 font-mono text-xs whitespace-pre-wrap text-fg",
			children
		})
	] });
}
function Checkpoints() {
	const checkpoints = useHarness((s) => s.checkpoints);
	const rewind = useHarness((s) => s.rewind);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm",
			children: "检查点"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: "只恢复本层写入，撤下之后的任务记录。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2",
			children: checkpoints.map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-2 border-t border-line py-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate font-mono text-xs",
					children: point.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 shrink-0 px-2 text-xs text-brass",
					onClick: () => rewind(point.id),
					children: "回到这里"
				})]
			}, point.id))
		})
	] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LatticeApp, {});
}
//#endregion
export { Home as component };
