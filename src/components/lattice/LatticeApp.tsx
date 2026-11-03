import { useEffect, useRef, useState } from "react";
import { CONTEXT_MAX, contextLoad, useHarness } from "@/lib/harness/store";
import { JUDGMENT, ROLES, SKILLS } from "@/lib/harness/seed";
import { voiceReview } from "@/lib/harness/voice";
import type { Mode, Step, Task, TaskStatus } from "@/lib/harness/types";
import { cn } from "@/lib/cn";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "ask", label: "询问", hint: "只读" },
  { id: "plan", label: "计划", hint: "先批再写" },
  { id: "act", label: "执行", hint: "直接进循环" },
];

const STATUS: Record<TaskStatus, string> = {
  queued: "排队",
  running: "执行中",
  awaiting: "等待裁决",
  done: "已验收",
  blocked: "已阻断",
  preempted: "已抢占",
  rejected: "已拒绝",
};

const PROMPTS = [
  "列出工作区并阅读 AGENTS.md",
  "先计划：给 loop.ts 补上死循环熔断",
  "直接改 README，强调任务是本体",
  "并行探索工具循环，并核对权限策略",
  "记住：写操作必须确认，用中文验收",
];

export function LatticeApp() {
  const boot = useHarness((s) => s.boot);
  const playing = useHarness((s) => s.playing);
  const tick = useHarness((s) => s.tick);
  const tasks = useHarness((s) => s.tasks);
  const memory = useHarness((s) => s.memory);
  const activeId = useHarness((s) => s.activeId);
  const grokVoice = useHarness((s) => s.grokVoice);
  const patchReview = useHarness((s) => s.patchReview);
  const setGrokNote = useHarness((s) => s.grokNote);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => tick(), 420);
    return () => window.clearInterval(id);
  }, [playing, tick]);

  const tried = useRef(new Set<string>());
  const pendingVoice = tasks.find(
    (t) =>
      grokVoice &&
      !t.voiced &&
      t.id !== "t0" &&
      (t.status === "done" || t.status === "blocked") &&
      t.steps.some((step) => step.tool && step.status === "ok"),
  );

  useEffect(() => {
    if (!pendingVoice || tried.current.has(pendingVoice.id)) return;
    tried.current.add(pendingVoice.id);
    const trace = pendingVoice.steps
      .map((step) => `${step.title} ${step.status} ${(step.output ?? "").slice(0, 240)}`)
      .join("\n");
    void voiceReview({
      data: {
        task: `${pendingVoice.goal}\n验收：${pendingVoice.acceptance.join("；")}`,
        trace,
        role: pendingVoice.roleId,
      },
    }).then((res) => {
      if (res.ok) patchReview(pendingVoice.id, res.text);
      else useHarness.setState({ grokNote: res.error });
    });
  }, [pendingVoice, patchReview]);

  const load = contextLoad(tasks, memory);
  const hot = load / CONTEXT_MAX >= 0.75;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <Header load={load} hot={hot} />
      <Controls />
      <DeckTabs />
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] min-[960px]:grid-cols-[minmax(0,1fr)_340px]">
        <TaskPane activeId={activeId} />
        <Deck />
      </div>
      <p className="sr-only" aria-live="polite">
        {setGrokNote ?? ""}
      </p>
    </div>
  );
}

function Header({ load, hot }: { load: number; hot: boolean }) {
  const presence = useHarness((s) => s.presence);
  const grokVoice = useHarness((s) => s.grokVoice);
  const setGrokVoice = useHarness((s) => s.setGrokVoice);
  const grokNote = useHarness((s) => s.grokNote);
  const compact = useHarness((s) => s.compact);
  const reset = useHarness((s) => s.reset);
  const pct = Math.min(100, Math.round((load / CONTEXT_MAX) * 100));
  const presenceLabel = presence === "exec" ? "执行中" : presence === "sealed" ? "段已封存" : "空闲";

  return (
    <header className="border-b border-line px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex items-end gap-1" aria-hidden="true">
          <span className="block h-3 w-1 bg-muted" />
          <span className="block h-5 w-1 bg-brass" />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-medium tracking-wide">织衡</h1>
          <p className="truncate text-xs text-muted">对话只下单。任务才执行。</p>
        </div>
        <p className="ml-auto font-mono text-xs text-muted">{presenceLabel}</p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1 min-w-0 flex-1 bg-line" title="轨迹占用">
          <div className={cn("h-1", hot ? "bg-threat" : "bg-brass")} style={{ width: `${pct}%` }} />
        </div>
        <p className="shrink-0 font-mono text-xs text-muted tabular-nums">
          {load}/{CONTEXT_MAX}
        </p>
        <button type="button" className="min-h-11 px-2 text-xs text-muted" onClick={() => compact()}>
          压缩
        </button>
        <button type="button" className="min-h-11 px-2 text-xs text-muted" onClick={() => reset()}>
          重置
        </button>
        <button
          type="button"
          className={cn("min-h-11 px-2 text-xs", grokVoice ? "text-brass" : "text-muted")}
          onClick={() => setGrokVoice(!grokVoice)}
          title="只用 Grok 重写验收，不替你跑工具"
        >
          {grokVoice ? "Grok 验收" : "编排验收"}
        </button>
      </div>
      {grokNote ? <p className="mt-1 text-xs text-threat">{grokNote}</p> : null}
    </header>
  );
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

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-line px-3 py-2">
      <div className="flex shrink-0 border border-line" role="group" aria-label="模式">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn("min-h-11 px-3 text-sm", mode === item.id ? "bg-brass text-ink" : "text-muted")}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 border border-line" role="group" aria-label="权限">
        <button
          type="button"
          className={cn("min-h-11 px-3 text-sm", gate === "confirm" ? "bg-raised text-fg" : "text-muted")}
          onClick={() => setGate("confirm")}
        >
          确认
        </button>
        <button
          type="button"
          className={cn("min-h-11 px-3 text-sm", gate === "open" ? "bg-raised text-fg" : "text-muted")}
          onClick={() => setGate("open")}
        >
          直跑
        </button>
      </div>
      <div className="flex shrink-0 border border-line" role="group" aria-label="转述角色">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            className={cn("min-h-11 px-3 text-sm", roleId === role.id ? "text-brass" : "text-muted")}
            onClick={() => setRole(role.id)}
            title={role.note}
          >
            {role.name}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 border border-line" role="group" aria-label="技能">
        {SKILLS.map((skill) => (
          <button
            key={skill.id}
            type="button"
            className={cn("min-h-11 px-3 text-sm", skillId === skill.id ? "text-brass" : "text-muted")}
            onClick={() => setSkill(skill.id)}
            title={skill.description}
          >
            {skill.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskPane({ activeId }: { activeId: string | null }) {
  const tab = useHarness((s) => s.tab);
  const tasks = useHarness((s) => s.tasks);
  const notice = useHarness((s) => s.notice);
  const endRef = useRef<HTMLDivElement | null>(null);
  const skipScroll = useRef(true);

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [tasks.length, activeId, tasks[tasks.length - 1]?.revealed, tasks[tasks.length - 1]?.status]);

  return (
    <section className={cn("flex h-full min-h-0 flex-col", tab !== "run" && "max-[959px]:hidden")}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          前脑收单、抢占、验收。后脑跑工具。没有目标的句子不会进循环。沙箱里的文件才算数。
        </p>
        {notice ? <p className="mb-3 text-sm text-brass">{notice}</p> : null}
        <ol className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} active={task.id === activeId} />
          ))}
        </ol>
        <div ref={endRef} />
      </div>
      <Composer />
    </section>
  );
}

function TaskCard({ task, active }: { task: Task; active: boolean }) {
  const [open, setOpen] = useState(task.status === "running" || task.status === "awaiting");
  const done = task.steps.slice(0, task.revealed);
  const pending = task.status === "running" || task.status === "awaiting" ? task.steps[task.revealed] : undefined;

  return (
    <li
      id={`task-${task.id}`}
      className={cn("border border-line bg-surface", active && "border-brass")}
    >
      <button type="button" className="flex w-full items-start gap-3 px-3 py-3 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="mt-1 font-mono text-xs text-muted">#{String(task.n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm">{task.goal}</span>
          <span className="mt-1 block text-xs text-muted">
            {STATUS[task.status]} · {task.route}
          </span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-line px-3 py-3">
          <p className="text-xs text-muted">原话</p>
          <p className="mt-1 text-sm">{task.utterance}</p>
          <ul className="mt-3 flex flex-col gap-1">
            {task.acceptance.map((item) => (
              <li key={item} className="text-xs text-muted">
                验收 · {item}
              </li>
            ))}
          </ul>
          <ol className="mt-3 flex flex-col gap-2">
            {done.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </ol>
          {pending ? (
            <div className="mt-3 border border-line bg-bg px-3 py-3">
              <p className="font-mono text-xs text-brass">
                {pending.brain === "front" ? "前脑" : "后脑"} · {pending.title}
              </p>
              <p className="mt-1 text-sm text-muted">{pending.detail}</p>
              {pending.planGate || pending.writes ? <Approval step={pending} /> : null}
            </div>
          ) : null}
          {task.status !== "running" && task.status !== "queued" && task.status !== "awaiting" ? (
            <p className="mt-3 text-sm whitespace-pre-wrap">{task.review}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function StepRow({ step }: { step: Step }) {
  const tone = step.status === "blocked" || step.status === "denied" ? "text-threat" : "text-muted";
  return (
    <li className="border border-line bg-bg px-3 py-2">
      <p className={cn("font-mono text-xs", tone)}>
        {step.brain === "front" ? "前脑" : "后脑"} · {step.title} · {step.status}
      </p>
      {step.output ? <Output text={step.output} /> : <p className="mt-1 text-xs text-muted">{step.detail}</p>}
    </li>
  );
}

function Output({ text }: { text: string }) {
  const [full, setFull] = useState(false);
  const long = text.length > 320;
  return (
    <div className="mt-2">
      <pre className="max-h-64 overflow-auto font-mono text-xs whitespace-pre-wrap text-fg">
        {full || !long ? text : `${text.slice(0, 320)}…`}
      </pre>
      {long ? (
        <button type="button" className="mt-1 min-h-11 text-xs text-brass" onClick={() => setFull((v) => !v)}>
          {full ? "收起输出" : "展开输出"}
        </button>
      ) : null}
    </div>
  );
}

function Approval({ step }: { step: Step }) {
  const approve = useHarness((s) => s.approve);
  const deny = useHarness((s) => s.deny);
  const files = useHarness((s) => s.files);
  const plan = Boolean(step.planGate);
  const current = step.patch ? files.find((f) => f.path === step.patch?.path) : undefined;
  return (
    <div className="mt-3">
      {step.patch ? (
        <p className="font-mono text-xs text-muted">
          {step.patch.path} · {current ? `${current.content.split("\n").length} → ${step.patch.content.split("\n").length} 行` : "新文件"}
        </p>
      ) : null}
      {step.output && plan ? (
        <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted">{step.output}</pre>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button type="button" className="min-h-11 bg-brass px-4 text-sm text-ink" onClick={() => approve()}>
          {plan ? "批准并执行" : "允许写入"}
        </button>
        <button type="button" className="min-h-11 border border-line px-4 text-sm" onClick={() => deny()}>
          {plan ? "驳回" : "拒绝"}
        </button>
      </div>
    </div>
  );
}

function Composer() {
  const dispatch = useHarness((s) => s.dispatch);
  const playing = useHarness((s) => s.playing);
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const send = () => {
    const next = text.trim();
    if (!next) return;
    dispatch(next);
    setText("");
  };

  return (
    <form
      className="border-t border-line bg-bg px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <div className="mb-2 flex gap-2 overflow-x-auto">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="min-h-11 shrink-0 border border-line px-3 text-xs text-muted"
            onClick={() => dispatch(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">下达任务</span>
          {mounted ? (
            <textarea
              value={text}
              rows={2}
              placeholder={playing ? "插话会抢占未验收的执行，并回滚它的写入" : "下目标，而不是闲聊"}
              className="w-full resize-none border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
          ) : (
            <div className="h-16 border border-line bg-surface" />
          )}
        </label>
        <button type="submit" className="min-h-11 bg-brass px-4 text-sm text-ink">
          下达
        </button>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {["你好", "熔断演示", "运行 rm -rf /"].map((probe) => (
          <button key={probe} type="button" className="min-h-11 px-2 text-xs text-muted" onClick={() => dispatch(probe)}>
            探针 · {probe}
          </button>
        ))}
      </div>
    </form>
  );
}

function DeckTabs() {
  const tab = useHarness((s) => s.tab);
  const setTab = useHarness((s) => s.setTab);
  const tabs = [
    { id: "run" as const, label: "任务" },
    { id: "spec" as const, label: "裁决" },
    { id: "files" as const, label: "文件" },
    { id: "memory" as const, label: "记忆" },
  ];
  return (
    <div className="flex border-b border-line min-[960px]:hidden" role="tablist">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          className={cn("min-h-11 flex-1 text-sm", tab === item.id ? "text-brass" : "text-muted")}
          onClick={() => setTab(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Deck() {
  const tab = useHarness((s) => s.tab);
  const setTab = useHarness((s) => s.setTab);
  const side = tab === "run" ? "spec" : tab;
  const tabs = [
    { id: "spec" as const, label: "裁决" },
    { id: "files" as const, label: "文件" },
    { id: "memory" as const, label: "记忆" },
  ];

  return (
    <aside className={cn("flex min-h-0 flex-col border-line min-[960px]:border-l", tab === "run" && "max-[959px]:hidden")}>
      <div className="hidden shrink-0 border-b border-line min-[960px]:flex" role="tablist" aria-label="执行侧栏">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={side === item.id}
            className={cn("min-h-11 flex-1 text-sm", side === item.id ? "text-brass" : "text-muted")}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {side === "spec" ? <Spec /> : null}
        {side === "files" ? <Files /> : null}
        {side === "memory" ? <Memory /> : null}
      </div>
    </aside>
  );
}

function Spec() {
  const paragraphs = JUDGMENT.split(/\n\n+/);
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-brass">收单 → 分流 → 计划闸 / 权限闸 → 工具循环 → 验收 → 封存</p>
      {paragraphs.map((para) => (
        <p key={para.slice(0, 16)} className="text-sm">
          {para}
        </p>
      ))}
      <ul className="flex flex-col gap-2 text-sm text-muted">
        <li>NORA：前脑说话，后脑干活。抢占、四层记忆、敏感确认、沙箱、熔断。</li>
        <li>Deva：一个对话入口。系统规范大于角色。exit_plan、只读子任务、/rewind、75% 压缩。</li>
        <li>冲突裁决：确认或直跑可切换。沙箱和危险命令不能关。</li>
      </ul>
      <p className="text-xs text-muted">
        对照{" "}
        <a className="text-brass" href="https://github.com/captain-wangrun-cn/N.O.R.A.Core" target="_blank" rel="noreferrer">
          NORA Core
        </a>{" "}
        与{" "}
        <a className="text-brass" href="https://github.com/sqfcyily/deva" target="_blank" rel="noreferrer">
          Deva
        </a>
        ，不是把两份代码并到一起。
      </p>
      <Checkpoints />
    </div>
  );
}

function Files() {
  const files = useHarness((s) => s.files);
  const selectedPath = useHarness((s) => s.selectedPath);
  const selectPath = useHarness((s) => s.selectPath);
  const file = files.find((item) => item.path === selectedPath) ?? files[0];
  return (
    <div>
      <ul className="mb-3 flex flex-col">
        {files.map((item) => (
          <li key={item.path}>
            <button
              type="button"
              className={cn("min-h-11 w-full text-left font-mono text-xs", item.path === file?.path ? "text-brass" : "text-muted")}
              onClick={() => selectPath(item.path)}
            >
              {item.path}
            </button>
          </li>
        ))}
      </ul>
      {file ? (
        <pre className="overflow-auto border border-line bg-bg p-3 font-mono text-xs whitespace-pre-wrap">{file.content}</pre>
      ) : null}
    </div>
  );
}

function Memory() {
  const memory = useHarness((s) => s.memory);
  const summaries = useHarness((s) => s.summaries);
  const slots = useHarness((s) => s.slots);
  const archive = useHarness((s) => s.archive);
  const tasks = useHarness((s) => s.tasks);
  return (
    <div className="flex flex-col gap-4">
      <Layer title="原始" note="任务轨迹">
        {tasks.length === 0 ? "空" : `${tasks.length} 条任务`}
      </Layer>
      <Layer title="摘要" note="压缩后留下的结论">
        {summaries.length === 0 ? "还没压缩" : summaries.map((s) => s.text).join("\n")}
      </Layer>
      <Layer title="槽位" note="当前约束">
        {slots.length === 0 ? "没有槽位" : slots.map((s) => s.value).join("\n")}
      </Layer>
      <Layer title="归档" note="卷出去的旧轨迹">
        {archive.length === 0 ? "归档为空" : archive.map((s) => s.text).join("\n")}
      </Layer>
      <Layer title="记忆条目" note="全局，单条 ≤ 300 字">
        {memory.length === 0 ? "用「记住：」写入约束" : memory.map((m) => m.text).join("\n")}
      </Layer>
    </div>
  );
}

function Layer({ title, note, children }: { title: string; note: string; children: string }) {
  return (
    <section>
      <h2 className="text-sm">{title}</h2>
      <p className="text-xs text-muted">{note}</p>
      <pre className="mt-2 font-mono text-xs whitespace-pre-wrap text-fg">{children}</pre>
    </section>
  );
}

function Checkpoints() {
  const checkpoints = useHarness((s) => s.checkpoints);
  const rewind = useHarness((s) => s.rewind);
  return (
    <section>
      <h2 className="text-sm">检查点</h2>
      <p className="text-xs text-muted">只恢复本层写入，撤下之后的任务记录。</p>
      <ul className="mt-2">
        {checkpoints.map((point) => (
          <li key={point.id} className="flex items-center justify-between gap-2 border-t border-line py-1">
            <span className="truncate font-mono text-xs">{point.label}</span>
            <button type="button" className="min-h-11 shrink-0 px-2 text-xs text-brass" onClick={() => rewind(point.id)}>
              回到这里
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
