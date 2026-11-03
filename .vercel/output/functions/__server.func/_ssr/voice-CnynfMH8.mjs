import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/voice-CnynfMH8.js
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
				content: "你是织衡的前脑，只做验收转述。不要寒暄，不要标题，不要声称执行了轨迹里没有的工具。120字以内中文，说明做到了什么、没做什么。"
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
//#endregion
export { voiceReview_createServerFn_handler };
