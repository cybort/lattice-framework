import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyStep, enactTask, estimateTokens, planTask } from "./engine";
import { cloneFiles, CONTEXT_MAX, seedFiles, seedTask } from "./seed";
import type {
  Checkpoint,
  Gate,
  MemoryEntry,
  Mode,
  Presence,
  RoleId,
  SkillId,
  Slot,
  SummaryNote,
  Task,
  VFile,
} from "./types";

export type TabId = "run" | "files" | "memory" | "spec";

interface HarnessData {
  tasks: Task[];
  files: VFile[];
  memory: MemoryEntry[];
  summaries: SummaryNote[];
  slots: Slot[];
  archive: SummaryNote[];
  checkpoints: Checkpoint[];
  mode: Mode;
  roleId: RoleId;
  gate: Gate;
  skillId: SkillId;
  presence: Presence;
  seq: number;
}

interface HarnessRuntime {
  tab: TabId;
  playing: boolean;
  activeId: string | null;
  selectedPath: string;
  grokVoice: boolean;
  grokNote: string | null;
  notice: string | null;
}

interface HarnessActions {
  boot: () => void;
  setTab: (tab: TabId) => void;
  setMode: (mode: Mode) => void;
  setRole: (roleId: RoleId) => void;
  setGate: (gate: Gate) => void;
  setSkill: (skillId: SkillId) => void;
  setGrokVoice: (on: boolean) => void;
  selectPath: (path: string) => void;
  dispatch: (utterance: string) => void;
  tick: () => void;
  approve: () => void;
  deny: () => void;
  rewind: (id: string) => void;
  compact: () => void;
  reset: () => void;
  patchReview: (id: string, text: string) => void;
  finishTask: (id: string, force?: "blocked") => void;
}

export type HarnessStore = HarnessData & HarnessRuntime & HarnessActions;

function fresh(): HarnessData {
  const files = seedFiles();
  const task = seedTask(files);
  return {
    tasks: [task],
    files,
    memory: [],
    summaries: [],
    slots: [],
    archive: [],
    checkpoints: [
      { id: "seed", label: "种子", at: 0, taskCount: 1, files: cloneFiles(files) },
    ],
    mode: "act",
    roleId: "dispatch",
    gate: "confirm",
    skillId: "none",
    presence: "sealed",
    seq: 1,
  };
}

function replaceTask(tasks: Task[], id: string, next: Task): Task[] {
  return tasks.map((t) => (t.id === id ? next : t));
}

function isStop(text: string): boolean {
  return /^(停|停下|停止|取消|别做了|别跑了)/.test(text);
}

function settleChat(task: Task): Task {
  return {
    ...task,
    status: "done",
    revealed: task.steps.length,
    steps: task.steps.map((step) =>
      step.status === "wait" ? { ...step, status: "ok" as const } : step,
    ),
  };
}

function restamp(task: Task, text: string, route: string): Task {
  const prefix = task.review.startsWith("裁决：")
    ? "裁决："
    : task.review.startsWith("验收：")
      ? "验收："
      : "回单：";
  return {
    ...settleChat(task),
    goal: text,
    route,
    review: prefix + text,
    steps: task.steps.map((step) => ({
      ...step,
      status: "ok" as const,
      title: "停止",
      detail: "判为停止。未验收写入回到本任务开始时的文件。",
      output: "动作：停止\n回滚：任务开始时的文件\n交执行：否",
    })),
  };
}

function activeWork(tasks: Task[], activeId: string | null): Task | null {
  const current = tasks.find((t) => t.id === activeId);
  if (!current) return null;
  if (current.status !== "running" && current.status !== "awaiting") return null;
  return current;
}

function syncSlots(memory: MemoryEntry[]): Slot[] {
  return memory.slice(-8).map((m) => ({
    key: m.text.slice(0, 12),
    value: m.text,
  }));
}

export const useHarness = create<HarnessStore>()(
  persist(
    (set, get) => ({
      ...fresh(),
      tab: "run",
      playing: false,
      activeId: "t0",
      selectedPath: "SPEC.md",
      grokVoice: false,
      grokNote: null,
      notice: null,

      boot: () => {
        void useHarness.persist.rehydrate();
      },

      setTab: (tab) => set({ tab }),
      setMode: (mode) => set({ mode, notice: null }),
      setRole: (roleId) => set({ roleId }),
      setGate: (gate) => set({ gate }),
      setSkill: (skillId) => set({ skillId }),
      setGrokVoice: (grokVoice) => set({ grokVoice, grokNote: null }),
      selectPath: (selectedPath) => set({ selectedPath, tab: "files" }),

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
        if (text === "/ask" || text === "询问") return set({ mode: "ask", notice: "模式已设为询问。只读。" });
        if (text === "/plan" || text === "计划") return set({ mode: "plan", notice: "模式已设为计划。写之前要批准。" });
        if (text === "/act" || text === "执行") return set({ mode: "act", notice: "模式已设为执行。" });
        if (text === "/skill plan" || text === "/skill 先计划") return set({ skillId: "plan-first" });
        if (text === "/skill explore" || text === "/skill 只读") return set({ skillId: "explore" });
        if (text === "/skill off" || text === "/skill 无") return set({ skillId: "none" });

        const current = activeWork(s.tasks, s.activeId);
        const n = s.seq;
        const plan = (files: VFile[]) =>
          planTask({
            utterance: text,
            files,
            mode: s.mode,
            roleId: s.roleId,
            skillId: s.skillId,
            n,
            at: Date.now(),
          });

        if (current && isStop(text)) {
          const files = cloneFiles(current.filesAtStart);
          const tasks = replaceTask(s.tasks, current.id, {
            ...current,
            status: "preempted",
            review: "已停止。未验收的写入已回滚。",
          });
          const reply = "执行已停。未验收的写入已回滚。";
          const task = restamp(plan(files), reply, "interrupt stop：回滚未验收写入");
          set({
            tasks: [...tasks, task],
            files,
            seq: n + 1,
            activeId: task.id,
            playing: false,
            presence: "sealed",
            tab: "run",
            notice: null,
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
              notice: "闲聊已旁路。执行还在跑，写入未回滚。",
            });
            return;
          }
          const files = cloneFiles(current.filesAtStart);
          const tasks = replaceTask(s.tasks, current.id, {
            ...current,
            status: "preempted",
            review: "未验收就被新任务抢占。本次写入已回滚。",
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
            notice: null,
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
            notice: null,
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
          notice: null,
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
        if (step.planGate || (step.writes && s.gate === "confirm" && !task.precleared)) {
          set({
            tasks: replaceTask(s.tasks, task.id, { ...task, status: "awaiting" }),
            playing: false,
            presence: "exec",
          });
          return;
        }
        if (step.status === "blocked") {
          const steps = task.steps.map((st, i) =>
            i === task.revealed ? { ...st, status: "blocked" as const } : st,
          );
          set({
            tasks: replaceTask(s.tasks, task.id, {
              ...task,
              steps,
              revealed: task.revealed + 1,
              status: "blocked",
            }),
            playing: false,
            presence: "sealed",
          });
          return;
        }

        let files = s.files;
        let memory = s.memory;
        const steps = task.steps.slice();
        let revealed = task.revealed;
        let blocked = false;
        const batch = step.batch;

        const take = (index: number) => {
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
            output: hint + applied.output,
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

        if (take(revealed) && batch) {
          while (revealed < steps.length) {
            const next = steps[revealed];
            if (next.batch !== batch || next.writes || next.planGate) break;
            if (!take(revealed)) break;
          }
        }

        set({
          tasks: replaceTask(s.tasks, task.id, {
            ...task,
            steps,
            revealed,
            status: blocked ? "blocked" : "running",
          }),
          files,
          memory,
          slots: syncSlots(memory),
          ...(blocked ? { playing: false, presence: "sealed" as const } : {}),
        });
        if (blocked || revealed >= steps.length) {
          get().finishTask(task.id, blocked ? "blocked" : undefined);
        }
      },

      approve: () => {
        const s = get();
        const task = s.tasks.find((t) => t.id === s.activeId && t.status === "awaiting");
        if (!task) return;
        const step = task.steps[task.revealed];
        if (!step) return;
        if (step.planGate) {
          const steps = task.steps.map((st, i) =>
            i === task.revealed ? { ...st, status: "ok" as const, output: st.output ?? "已批准" } : st,
          );
          const closed: Task = {
            ...task,
            steps,
            revealed: steps.length,
            status: "done",
            review: "回单：计划已批准，转入执行。",
          };
          const child = enactTask(task, s.seq, s.files, Date.now());
          if (!child) {
            set({ tasks: replaceTask(s.tasks, task.id, closed), playing: false, presence: "sealed" });
            return;
          }
          child.status = "running";
          set({
            tasks: [...replaceTask(s.tasks, task.id, closed), child],
            seq: s.seq + 1,
            activeId: child.id,
            playing: true,
            presence: "exec",
          });
          return;
        }
        const applied = applyStep(s.files, s.memory, step, Date.now());
        const steps = task.steps.map((st, i) =>
          i === task.revealed ? { ...st, status: applied.status, output: applied.output } : st,
        );
        const revealed = task.revealed + 1;
        const updated: Task = { ...task, steps, revealed, status: "running" };
        set({
          tasks: replaceTask(s.tasks, task.id, updated),
          files: applied.files,
          memory: applied.memory,
          slots: syncSlots(applied.memory),
          playing: true,
          presence: "exec",
        });
        if (revealed >= steps.length || applied.status === "blocked") {
          get().finishTask(task.id, applied.status === "blocked" ? "blocked" : undefined);
        }
      },

      deny: () => {
        const s = get();
        const task = s.tasks.find((t) => t.id === s.activeId && t.status === "awaiting");
        if (!task) return;
        const steps = task.steps.map((st, i) =>
          i === task.revealed ? { ...st, status: "denied" as const, output: "已拒绝。工作区未改。" } : st,
        );
        set({
          tasks: replaceTask(s.tasks, task.id, {
            ...task,
            steps,
            revealed: task.revealed + 1,
            status: "rejected",
            review: "回单：已拒绝。未验收的写入不会落地。",
          }),
          playing: false,
          presence: "sealed",
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
          checkpoints: s.checkpoints.filter((c) => c.at <= point.at || c.id === "seed"),
        });
      },

      compact: () => {
        const s = get();
        if (s.tasks.length < 2) {
          set({ notice: "轨迹太短，还不需要压缩。" });
          return;
        }
        const keep = 2;
        const fold = s.tasks.slice(0, Math.max(0, s.tasks.length - keep));
        const notes: SummaryNote[] = fold.map((t) => ({
          id: `sum-${t.id}`,
          covering: t.n,
          text: `#${t.n} ${t.goal} → ${t.review.replace(/\s+/g, " ").slice(0, 80)}`,
        }));
        const tasks = s.tasks.map((t, i) => {
          if (i >= s.tasks.length - keep) return t;
          if (t.steps.length <= 1 && t.steps[0]?.title === "已折叠") return t;
          return {
            ...t,
            steps: [
              {
                id: `${t.id}-fold`,
                brain: "front" as const,
                title: "已折叠",
                detail: "原文进入摘要层与归档。",
                status: "ok" as const,
                output: notes.find((n) => n.covering === t.n)?.text,
              },
            ],
            revealed: 1,
          };
        });
        set({
          tasks,
          summaries: [...s.summaries, ...notes],
          archive: [...s.archive, ...notes],
          notice: `已压缩 ${notes.length} 条轨迹。记忆槽位不动。`,
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
          notice: "沙箱已回到种子。",
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
            voiced: true,
          }),
          grokNote: null,
        });
      },

      finishTask: (id: string, force?: "blocked") => {
        const s = get();
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return;
        const blocked = force === "blocked" || task.steps.some((st) => st.status === "blocked");
        const status = blocked ? "blocked" : task.status === "rejected" ? "rejected" : "done";
        const done: Task = {
          ...task,
          status,
          revealed: blocked ? task.revealed : Math.max(task.revealed, task.steps.length),
        };
        const changed = JSON.stringify(s.files) !== JSON.stringify(task.filesAtStart);
        const checkpoints = [...s.checkpoints];
        if (changed && status === "done") {
          checkpoints.push({
            id: `cp-${task.id}`,
            label: `#${task.n} ${task.goal.slice(0, 18)}`,
            at: Date.now(),
            taskCount: s.tasks.findIndex((t) => t.id === id) + 1,
            files: cloneFiles(s.files),
          });
        }
        set({
          tasks: replaceTask(s.tasks, id, done),
          checkpoints,
          playing: false,
          presence: "sealed",
        });
      },
    }),
    {
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
        seq: s.seq,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.playing = false;
        state.tasks = state.tasks.map((t) =>
          t.status === "running" || t.status === "queued" || t.status === "awaiting"
            ? { ...t, status: "preempted", review: t.review || "会话中断，未验收。" }
            : t,
        );
        state.presence = "sealed";
      },
    },
  ),
);

export function contextLoad(tasks: Task[], memory: MemoryEntry[]): number {
  return estimateTokens(tasks, memory);
}

export { CONTEXT_MAX };
