import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/voice-UZrCrCDp.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var voiceReview_createServerFn_handler = createServerRpc({
	id: "43acf2d508acba03ade74c0d5e6b417812d35b475645bacc00cb94405465d8a4",
	name: "voiceReview",
	filename: "src/lib/harness/voice.ts"
}, (opts) => voiceReview.__executeServer(opts));
var voiceReview = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	return {
		task: String(raw.task ?? "").slice(0, 1500),
		trace: String(raw.trace ?? "").slice(0, 3500),
		role: String(raw.role ?? "dispatch").slice(0, 24)
	};
}).handler(voiceReview_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "验收模型不可用"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 280,
			temperature: .3,
			messages: [{
				role: "system",
				content: "你是织衡的回话。只做验收转述。不要寒暄，不要标题，不要声称执行了轨迹里没有的工具。不要提外部项目名。120字以内中文，说明做到了什么、没做什么。"
			}, {
				role: "user",
				content: `角色 ${data.role}\n任务 ${data.task}\n轨迹\n${data.trace}`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `模型 ${res.status}`
	};
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "空转述"
	};
	return {
		ok: true,
		text
	};
});
var frontSpeak_createServerFn_handler = createServerRpc({
	id: "ae8192f183a72e56092aed983d797977d3464d3fc6c3ad26c5d4a2ca845bf292",
	name: "frontSpeak",
	filename: "src/lib/harness/voice.ts"
}, (opts) => frontSpeak.__executeServer(opts));
var frontSpeak = createServerFn({ method: "POST" }).validator((input) => {
	const raw = input;
	return {
		utterance: String(raw.utterance ?? "").slice(0, 500),
		draft: String(raw.draft ?? "").slice(0, 800),
		role: String(raw.role ?? "dispatch").slice(0, 24)
	};
}).handler(frontSpeak_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "回话转述不可用"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 180,
			temperature: .4,
			messages: [{
				role: "system",
				content: "你是织衡的回话。用户这句话没有任务，所以你不调用工具、不改文件、不声称查过工作区。用中文重写下面的草稿，80字以内，保留「不交执行」这个事实。不要标题，不要外部项目名，不要内部控制标记。"
			}, {
				role: "user",
				content: `角色 ${data.role}\n用户 ${data.utterance}\n草稿 ${data.draft}`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `模型 ${res.status}`
	};
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "空回复"
	};
	return {
		ok: true,
		text: text.slice(0, 240)
	};
});
//#endregion
export { frontSpeak_createServerFn_handler, voiceReview_createServerFn_handler };
