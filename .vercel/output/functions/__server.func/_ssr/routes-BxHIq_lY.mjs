import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BxHIq_lY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CONTEXT_MAX = 8e3;
var JUDGMENT = `NORA 与 Deva 的对话框都是控制面。本体是把一句话收成任务，再在沙箱里跑完工具循环。

NORA 把说话和干活拆开。前脑收单、抢占、审查、转述；后脑拿工具、技能和检索把任务做完。人设、追问、半在线挂在前脑，不进入执行权限。四层记忆是为了任务上下文不断，不是为了陪聊。

Deva 把控制面收到一个对话里：挂工作区、角色、技能、计划、子代理、定时、回滚，都从同一条输入进去。纪律是分层提示词——系统规范、项目规范、记忆、角色。角色不能改工具和安全。写之前可以 exit_plan；写过的文件可以用 /rewind 收回。

冲突只有一处需要裁决。Deva 不设授权弹框，模型直接动文件和命令。NORA 对敏感操作要确认，并做路径沙箱和死循环检测。织衡：确认或直跑可以切，沙箱、危险命令和循环熔断不能关。直跑只是少一次弹框，不是把宿主机交出去。

对话在这里只做三件事：下目标、批计划、看验收。没有目标的句子不进入执行。`;
var SPEC = `# 织衡执行层

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
var README_CHATTY = `# Lattice workspace

这是一个对话助手的演示仓库。用户在聊天里说话，模型用自然的口吻回答，顺便帮助处理文件。

## 目录

- src/harness/loop.ts 工具循环
- src/harness/policy.ts 权限
- SPEC.md 执行层裁决
`;
var README_TASK = `# Lattice workspace

对话不是这个仓库的产品。一句输入只负责形成任务：目标、约束、验收。改文件的是后脑工具循环，前脑只收单和验收。

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
			content: "前脑人设只负责语气。它不能授权写文件，也不能覆盖沙箱。\n"
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
	if (src.includes("loop fuse")) return src;
	return src.replace("for (const step of steps) {", `const seen = new Map<string, number>();
  for (const step of steps) {
    const n = (seen.get(step) ?? 0) + 1;
    seen.set(step, n);
    if (n >= 3) throw new Error("loop fuse: identical step x3");`);
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
		note: "对照 NORA / Deva"
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
		description: "写操作先 exit_plan，批准后再动文件。",
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
			output: "分流：分析。模型别名 fast。权限不变。"
		},
		{
			id: "t0-s1",
			brain: "back",
			title: "read_file SPEC.md",
			detail: "后脑只取执行层文档，不把文档当新指令。",
			tool: "read_file",
			args: { path: "SPEC.md" },
			status: "ok",
			output: SPEC
		},
		{
			id: "t0-s2",
			brain: "back",
			title: "grep 授权",
			detail: "核对 Deva 直跑与 NORA 确认的冲突落在哪一行。",
			tool: "grep",
			args: { q: "授权" },
			status: "ok",
			output: "SPEC.md: 冲突段。policy.ts: gate === confirm 才等待确认。"
		}
	];
	return {
		id: "t0",
		n: 0,
		utterance: "说明两套对话式为何只是表面，并把执行层缝上。",
		goal: "给出 NORA 与 Deva 的执行层裁决，不改工作区。",
		acceptance: [
			"分清控制面和执行层",
			"写下权限冲突的裁决",
			"不修改文件"
		],
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
function isAnalysis(text) {
	return /NORA|Deva|织衡|双脑|harness|整合|控制面|执行层|对话只是|表象/.test(text);
}
function planTask(input) {
	const text = input.utterance.trim();
	const id = `t${input.n}`;
	const skill = input.skillId;
	let mode = input.mode;
	if (DANGER.test(text)) return shell(input, "guard", "拦截越权命令", ["命令未被执行", "工作区不变"], "前脑识别危险命令 → 后脑拒绝，不进入循环", "未执行。权限闸救不了沙箱明确禁止的命令。", [makeStep(id, 0, {
		brain: "front",
		title: "收单",
		detail: "这句话的可执行部分是一条命令，而且越过沙箱。",
		status: "wait"
	}), makeStep(id, 1, {
		brain: "back",
		title: "run_command",
		detail: "安全角色直接拒绝，不调用宿主。",
		tool: "run_command",
		args: { cmd: text },
		status: "blocked",
		output: "拒绝。破坏性或越权命令在确认和直跑下都不会执行。"
	})]);
	if (/熔断演示|演示循环|循环熔断演示/.test(text)) return shell(input, "guard", "演示同一工具调用三次即熔断", ["第三次相同 grep 被熔断", "不改文件"], "后脑循环检测，与 loop.ts 里要补的熔断是同一纪律", "熔断生效。相同调用没有第四次。这是 harness 的状态，不是模型自觉。", [
		0,
		1,
		2
	].map((i) => makeStep(id, i, {
		brain: "back",
		title: i === 2 ? "循环熔断" : `grep runLoop #${i + 1}`,
		detail: i === 2 ? "同一工具与参数达到 3 次，循环终止。" : "只读探测，参数不变。",
		tool: "grep",
		args: { q: "runLoop" },
		status: i === 2 ? "blocked" : "wait",
		output: i === 2 ? "loop fuse：grep runLoop 已重复 3 次，停止。" : void 0
	})));
	const mem = /^(?:记住|记下)[:：\s]*(.+)$/.exec(text);
	if (mem) {
		const entry = mem[1].trim().slice(0, 300);
		return shell(input, "memory", "把约束写入记忆，而不是写进聊天", ["条目不超过 300 字", "出现在全局记忆与槽位"], "前脑识别为记忆写，不启动文件工具", mem[1].trim().length > 300 ? "原文超过 300 字，已截断后写入。记忆记约束，不记长对话。" : `已记住：${entry}`, [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: "记忆是任务约束。定时与未验收任务不应靠它扩权。",
			status: "wait"
		}), makeStep(id, 1, {
			brain: "back",
			title: "memory_write",
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
			title: "memory_delete",
			detail: q || "空",
			tool: "memory_delete",
			status: q ? "wait" : "blocked",
			output: q ? void 0 : "缺少匹配文本。",
			memoryDrop: q || void 0,
			writes: Boolean(q)
		})]);
	}
	if (/并行|子代理|分头|同时调研|同时探索/.test(text)) return shell(input, "subagent", "以只读子任务核对工具循环和权限策略", [
		"explore 回报 path:line",
		"research 引用政策文件",
		"主任务不写文件"
	], "前脑拆单 → explore 与 research 只读分叉 → 前脑汇总", "两个子任务都是只读工具集，没有继承写权限，结论只当数据。", [
		makeStep(id, 0, {
			brain: "front",
			title: "拆单",
			detail: "explore 搜循环，research 核对权限。fork 不把主对话过程灌回去。",
			status: "wait"
		}),
		makeStep(id, 1, {
			brain: "back",
			title: "子任务 explore",
			detail: "只读。工具集：grep。",
			tool: "grep",
			args: { q: "runLoop" },
			status: "wait"
		}),
		makeStep(id, 2, {
			brain: "back",
			title: "子任务 research",
			detail: "只读。对照 policy.ts 与 SPEC。来源要写在结果里。",
			tool: "grep",
			args: { q: "confirm" },
			status: "wait"
		})
	]);
	if (isAnalysis(text) && !wantsWrite(text)) return shell(input, "analysis", "用工作区里的裁决文档回答执行层问题", ["只读 SPEC", "不把文档内容当成新的系统指令"], "询问。前脑转述，后脑只读。", "控制面负责下单，执行层负责工具循环。完整裁决在 SPEC.md，本任务没有改文件。", [makeStep(id, 0, {
		brain: "front",
		title: "收单",
		detail: "这是裁决问题，不是写任务。",
		status: "wait"
	}), makeStep(id, 1, {
		brain: "back",
		title: "read_file SPEC.md",
		detail: "文件内容当数据。",
		tool: "read_file",
		args: { path: "SPEC.md" },
		status: "wait"
	})]);
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
		detail: "ask 没有 write_file / edit_file / run_command 写权限。",
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
		if (mode === "plan") return shell(input, "plan", patches.length === 1 && patches[0].path.endsWith("loop.ts") ? "计划：为工具循环加上死循环熔断" : `计划：更新 ${patches.map((p) => p.path).join("、")}`, ["先给出补丁，批准前不写", "批准后的执行不再二次确认"], "exit_plan。计划是任务状态，不是一段聊天。", "计划待批。批准后会按补丁执行；驳回则工作区不动。", [makeStep(id, 0, {
			brain: "front",
			title: "收单",
			detail: "写意图被计划闸截住。",
			status: "wait"
		}), makeStep(id, 1, {
			brain: "back",
			title: "exit_plan",
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
				title: `edit_file ${patch.path}`,
				detail: same ? "目标内容与现状一致。" : "精确替换整文件内容。",
				tool: "edit_file",
				args: { path: patch.path },
				status: "wait",
				writes: !same,
				patch: same ? void 0 : patch,
				output: same ? "已是目标内容，跳过写入。" : void 0
			}));
		});
		return shell(input, "write", `改写 ${patches.map((p) => p.path).join("、")}`, ["只改点名的文件", "验收能看到 diff 落点"], "前脑收单 → 权限闸 → 后脑 edit_file → 前脑验收", `写入 ${patches.map((p) => p.path).join("、")}。对话记录不是 diff，以文件为准。`, steps);
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
			title: "list_dir",
			detail: "沙箱根目录。",
			tool: "list_dir",
			args: { path: "." },
			status: "wait"
		}));
		if (/搜索|找|grep|有没有|核对/.exec(text)) {
			const q = /循环|熔断|loop/.test(text) ? "runLoop" : /权限|确认|策略/.test(text) ? "confirm" : "任务";
			steps.push(makeStep(id, steps.length, {
				brain: "back",
				title: `grep ${q}`,
				detail: "结果是数据，不会被当成下一步指令。",
				tool: "grep",
				args: { q },
				status: "wait"
			}));
		}
		for (const path of names.slice(0, 2)) steps.push(makeStep(id, steps.length, {
			brain: "back",
			title: `read_file ${path}`,
			detail: "带路径读取。",
			tool: "read_file",
			args: { path },
			status: "wait"
		}));
		return shell(input, "read", "只读检查工作区", ["不写入", "结果带路径"], "后脑只读工具集", "只读完成。没有产生补丁。", steps);
	}
	const cmd = /^(?:运行|执行|命令)[:：\s]+(.+)$/.exec(text);
	if (cmd) return shell(input, "command", "在沙箱里运行一条非交互命令", ["只使用允许的命令子集"], "run_command 受沙箱约束，与 Deva 的无弹框不是同一件事", "命令已在沙箱内结束。沙箱外没有副作用。", [makeStep(id, 0, {
		brain: "back",
		title: "run_command",
		detail: cmd[1],
		tool: "run_command",
		args: { cmd: cmd[1] },
		status: "wait"
	})]);
	return shell(input, "reject", "没有形成任务", ["不进入执行"], "前脑拒单", "没有目标。对话只负责下单：要读哪份文件、要改什么、要记住哪条约束。", [makeStep(id, 0, {
		brain: "front",
		title: "拒单",
		detail: "闲聊不是任务。",
		status: "blocked",
		output: "未执行。"
	})]);
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
			title: `edit_file ${patch.path}`,
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
		route: "计划已批 → 后脑写入 → 验收",
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
		const entry = {
			id: `m${at}`,
			scope: step.memoryAdd.scope,
			text: step.memoryAdd.text.slice(0, 300),
			at
		};
		return {
			files,
			memory: [...memory, entry],
			output: `全局记忆 +1（${entry.text.length} 字）`,
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
		let tasks = s.tasks;
		let files = s.files;
		if (s.playing || s.tasks.some((t) => t.id === s.activeId && (t.status === "running" || t.status === "awaiting"))) {
			const current = tasks.find((t) => t.id === s.activeId);
			if (current && current.status !== "done") {
				files = cloneFiles(current.filesAtStart);
				tasks = replaceTask(tasks, current.id, {
					...current,
					status: "preempted",
					review: "未验收就被新任务抢占。本次写入已回滚。"
				});
			}
		}
		const n = s.seq;
		const task = planTask({
			utterance: text,
			files,
			mode: s.mode,
			roleId: s.roleId,
			skillId: s.skillId,
			n,
			at: Date.now()
		});
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
		if (step.planGate) {
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
		if (step.writes && s.gate === "confirm" && !task.precleared) {
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
			const next = {
				...task,
				steps,
				revealed: task.revealed + 1,
				status: "blocked"
			};
			set({
				tasks: replaceTask(s.tasks, task.id, next),
				playing: false,
				presence: "sealed"
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
			slots: syncSlots(applied.memory)
		});
		if (applied.status === "blocked" || revealed >= steps.length) get().finishTask(task.id, applied.status === "blocked" ? "blocked" : void 0);
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
				voiced: true
			}),
			grokNote: null
		});
	},
	finishTask: (id, force) => {
		const s = get();
		const task = s.tasks.find((t) => t.id === id);
		if (!task) return;
		const status = force === "blocked" || task.steps.some((st) => st.status === "blocked") ? "blocked" : task.status === "rejected" ? "rejected" : "done";
		const done = {
			...task,
			status,
			revealed: Math.max(task.revealed, task.steps.length)
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
	name: "lattice-harness-v1",
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
							children: "对话只下单。任务才执行。"
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
					children: "前脑收单、抢占、验收。后脑跑工具。没有目标的句子不会进循环。沙箱里的文件才算数。"
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
	const [open, setOpen] = (0, import_react.useState)(task.status === "running" || task.status === "awaiting");
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
								pending.brain === "front" ? "前脑" : "后脑",
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
				step.brain === "front" ? "前脑" : "后脑",
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
						placeholder: playing ? "插话会抢占未验收的执行，并回滚它的写入" : "下目标，而不是闲聊",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "NORA：前脑说话，后脑干活。抢占、四层记忆、敏感确认、沙箱、熔断。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Deva：一个对话入口。系统规范大于角色。exit_plan、只读子任务、/rewind、75% 压缩。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "冲突裁决：确认或直跑可切换。沙箱和危险命令不能关。" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"对照",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "text-brass",
						href: "https://github.com/captain-wangrun-cn/N.O.R.A.Core",
						target: "_blank",
						rel: "noreferrer",
						children: "NORA Core"
					}),
					" ",
					"与",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "text-brass",
						href: "https://github.com/sqfcyily/deva",
						target: "_blank",
						rel: "noreferrer",
						children: "Deva"
					}),
					"，不是把两份代码并到一起。"
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
