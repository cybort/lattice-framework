export type Mode = "ask" | "plan" | "act";
export type Gate = "confirm" | "open";
export type RoleId = "dispatch" | "field" | "arch";
export type SkillId = "none" | "plan-first" | "explore";
export type Presence = "idle" | "exec" | "sealed";
export type TaskStatus =
  | "queued"
  | "running"
  | "awaiting"
  | "done"
  | "blocked"
  | "preempted"
  | "rejected";
export type TaskKind =
  | "analysis"
  | "reject"
  | "read"
  | "write"
  | "plan"
  | "memory"
  | "subagent"
  | "guard"
  | "command"
  | "forget"
  | "chat";
export type StepStatus = "wait" | "ok" | "denied" | "blocked";

export interface VFile {
  path: string;
  content: string;
}

export interface MemoryEntry {
  id: string;
  scope: "global" | "project";
  text: string;
  at: number;
}

export interface SummaryNote {
  id: string;
  text: string;
  covering: number;
}

export interface Slot {
  key: string;
  value: string;
}

export interface Patch {
  path: string;
  content: string;
}

export interface Step {
  id: string;
  brain: "front" | "back";
  title: string;
  detail: string;
  tool?: string;
  args?: Record<string, string>;
  output?: string;
  status: StepStatus;
  writes?: boolean;
  planGate?: boolean;
  patch?: Patch;
  memoryAdd?: { scope: "global" | "project"; text: string };
  memoryDrop?: string;
  batch?: string;
}

export interface Checkpoint {
  id: string;
  label: string;
  at: number;
  taskCount: number;
  files: VFile[];
}

export interface Task {
  id: string;
  n: number;
  utterance: string;
  goal: string;
  acceptance: string[];
  mode: Mode;
  kind: TaskKind;
  status: TaskStatus;
  route: string;
  roleId: RoleId;
  steps: Step[];
  revealed: number;
  review: string;
  createdAt: number;
  precleared?: boolean;
  enact?: { goal: string; acceptance: string[]; patches: Patch[] };
  filesAtStart: VFile[];
  voiced?: boolean;
}

export interface RoleDef {
  id: RoleId;
  name: string;
  note: string;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
  body: string;
}
