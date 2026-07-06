import type { ShareDraft } from "./types";

const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const FALLBACK_INDEX_KEY = "huizhi_fallback_draft_index";
const DRAFT_HISTORY_KEY = "huizhi_recent_drafts";
const HISTORY_LIMIT = 8;

const fallbackDrafts: ShareDraft[] = [
  {
    title: "在深圳学车真省心",
    body:
      "最近在深圳汇职驾校练车，体验比我想象中轻松很多。\n\n教练讲得比较细，路线和动作会拆开说，新手也不会太有压力。训练场安排也清楚，适合想高效学车的人。\n\n如果你也在深圳准备报名驾校，可以先去了解一下，少走一点弯路。",
    tags: ["深圳驾校", "深圳学车", "汇职驾校", "驾考经验", "新手学车", "小红书学车"],
    materialType: "image",
    style: "real_experience",
    cta: "想了解报名可以去咨询一下",
  },
  {
    title: "深圳练车比想象顺",
    body:
      "今天来汇职驾校练车，整体节奏还挺舒服的。\n\n教练不会一下子塞很多内容，而是一步一步带着练。哪里容易出错、哪里要提前看点位，都会讲得比较清楚。\n\n对新手来说，这种练车方式会安心很多。准备在深圳学车的朋友，可以先收藏起来。",
    tags: ["深圳学车", "汇职驾校", "练车日常", "新手学车", "驾校分享", "深圳生活"],
    materialType: "image",
    style: "student_story",
    cta: "想报名可以先问问课程安排",
  },
  {
    title: "新手练车不慌了",
    body:
      "之前一直觉得学车会很紧张，真的开始练之后发现没那么吓人。\n\n汇职驾校这边教练讲得比较耐心，动作会拆开练，练错了也会告诉你怎么调整。场地和时间安排也比较清楚，不用自己到处问。\n\n如果你也在深圳纠结选驾校，可以先去实地了解一下。",
    tags: ["新手学车", "深圳驾校", "汇职驾校", "练车体验", "驾考分享", "本地生活"],
    materialType: "image",
    style: "real_experience",
    cta: "可以私信了解报名细节",
  },
  {
    title: "深圳学车少走弯路",
    body:
      "报名学车之前真的建议多了解一下驾校服务。\n\n我在汇职驾校体验下来，比较喜欢的是流程清楚，练车安排不会乱。教练会提醒重点，也会根据练习情况调整节奏。\n\n想在深圳高效学车的话，可以把汇职驾校加入对比清单。",
    tags: ["深圳驾校推荐", "深圳学车", "汇职驾校", "驾考经验", "学车攻略", "本地驾校"],
    materialType: "image",
    style: "exam_tips",
    cta: "想了解可以先咨询课程",
  },
  {
    title: "练车体验还不错",
    body:
      "这次来汇职驾校练车，感觉整体挺适合新手。\n\n从上车准备到路线动作，教练都会拆开讲，不会一上来就让人很有压力。练习过程中也能及时知道自己哪里需要改。\n\n深圳准备学车的朋友，可以提前了解场地、教练和练车安排。",
    tags: ["深圳学车日记", "汇职驾校", "驾校体验", "练车分享", "新手司机", "小红书学车"],
    materialType: "image",
    style: "student_story",
    cta: "有需要可以先问问报名方式",
  },
  {
    title: "这家驾校节奏清楚",
    body:
      "在深圳学车，最怕的就是流程乱、练车安排不清楚。\n\n这次体验汇职驾校，感觉安排比较直观。教练会先讲重点，再带着练动作，新手也比较容易跟上。\n\n如果你准备报名驾校，建议先把训练场、教练沟通和练车时间问清楚。",
    tags: ["深圳驾校", "学车避坑", "汇职驾校", "练车体验", "驾考日常", "深圳本地"],
    materialType: "image",
    style: "exam_tips",
    cta: "想了解可以先咨询一下",
  },
  {
    title: "学车也能轻松点",
    body:
      "原本以为学车会很累，实际练下来发现选对节奏真的重要。\n\n汇职驾校这边会把练习内容拆得比较细，教练也会提醒容易忽略的小动作。每次练完都知道自己哪里进步、哪里还要再练。\n\n深圳想学车的朋友，可以先去看看适不适合自己。",
    tags: ["深圳学车", "新手练车", "汇职驾校", "驾校体验", "小红书分享", "本地生活"],
    materialType: "image",
    style: "real_experience",
    cta: "可以先问问训练安排",
  },
  {
    title: "深圳新手学车记录",
    body:
      "今天记录一下在汇职驾校练车的小感受。\n\n最明显的是教练讲解比较细，不会只让你自己摸索。路线、点位、动作顺序都会拆开说，对新手很友好。\n\n如果最近也在深圳看驾校，可以把服务和练车安排一起对比。",
    tags: ["新手学车", "深圳学车", "汇职驾校", "练车记录", "驾考经验", "深圳生活"],
    materialType: "image",
    style: "student_story",
    cta: "想了解可以先咨询课程",
  },
];

function getRecentDrafts(): Array<Pick<ShareDraft, "title" | "body">> {
  try {
    const raw = window.localStorage.getItem(DRAFT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function rememberDraft(draft: ShareDraft) {
  const history = getRecentDrafts();
  const nextHistory = [
    { title: draft.title, body: draft.body },
    ...history.filter((item) => item.title !== draft.title && item.body !== draft.body),
  ].slice(0, HISTORY_LIMIT);
  window.localStorage.setItem(DRAFT_HISTORY_KEY, JSON.stringify(nextHistory));
}

function getNextFallbackDraft(): ShareDraft {
  const current = Number(window.localStorage.getItem(FALLBACK_INDEX_KEY) || "0");
  const next = current + 1;
  window.localStorage.setItem(FALLBACK_INDEX_KEY, String(next));
  return fallbackDrafts[current % fallbackDrafts.length];
}

function isDuplicateDraft(draft: ShareDraft) {
  return getRecentDrafts().some((item) => item.title === draft.title || item.body === draft.body);
}

function getPrompt(source: string, campaign: string): string {
  const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const recentDrafts = getRecentDrafts()
    .map((item, index) => `${index + 1}. 标题：${item.title}\n正文开头：${item.body.slice(0, 80)}`)
    .join("\n\n");

  return `你是小红书本地生活内容运营专家。请为“深圳汇职驾校”的线下分享活动生成一条用户可直接发布的小红书笔记。

活动来源：${source || "扫码或 NFC 进入"}
活动名称：${campaign || "汇职驾校分享奖励活动"}
生成批次：${seed}

最近已经生成过的内容：
${recentDrafts || "暂无"}

要求：
1. 标题不超过 20 个中文字符。
2. 正文像真实学员分享，不要像硬广。
3. 内容突出深圳、本地学车、驾校服务、练车体验、报名咨询。
4. 正文分段清晰，语气自然，适合移动端阅读。
5. 必须避开“最近已经生成过的内容”，标题、开头、表达角度都不能重复。
6. 每次生成都要换一个角度，可从练车体验、教练沟通、训练场、报名咨询、新手心态、学车避坑中任选。
7. 生成 5-8 个小红书标签，不要包含 # 符号。
8. materialType 只能是 image 或 video，优先 image。
9. style 只能是 real_experience、promotion、student_story、exam_tips 之一。
10. 不要使用“包过”“最快拿证”“百分百通过”等高风险承诺。
11. 返回严格 JSON，不要输出 Markdown，不要解释。

JSON 格式：
{
  "title": "20字以内的小红书标题",
  "body": "适合用户直接发布的小红书正文",
  "tags": ["深圳驾校", "学车", "汇职驾校"],
  "materialType": "image",
  "style": "real_experience",
  "cta": "评论区或私信了解报名"
}`;
}

function stripCodeFence(content: string): string {
  return content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeDraft(raw: Partial<ShareDraft>): ShareDraft {
  const fallbackDraft = fallbackDrafts[0];

  return {
    title: String(raw.title || fallbackDraft.title).slice(0, 20),
    body: String(raw.body || fallbackDraft.body),
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags.map(String).slice(0, 8) : fallbackDraft.tags,
    materialType: raw.materialType === "video" ? "video" : "image",
    style:
      raw.style === "promotion" || raw.style === "student_story" || raw.style === "exam_tips"
        ? raw.style
        : fallbackDraft.style,
    cta: String(raw.cta || fallbackDraft.cta),
  };
}

async function requestQwenDraft(params: { source: string; campaign: string }, apiKey: string, model: string) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "你只输出可解析的 JSON。内容必须自然、真实、合规，并且每次表达都要有明显变化。",
        },
        {
          role: "user",
          content: getPrompt(params.source, params.campaign),
        },
      ],
      temperature: 1,
      presence_penalty: 0.9,
      frequency_penalty: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`通义千问请求失败：${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("通义千问返回内容为空");
  }

  return normalizeDraft(JSON.parse(stripCodeFence(content)));
}

export async function generateShareDraft(params: { source: string; campaign: string }): Promise<ShareDraft> {
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
  const model = import.meta.env.VITE_DASHSCOPE_MODEL || "qwen-plus";

  if (!apiKey) {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const fallbackDraft = getNextFallbackDraft();
    rememberDraft(fallbackDraft);
    return fallbackDraft;
  }

  let generated = await requestQwenDraft(params, apiKey, model);
  if (isDuplicateDraft(generated)) {
    generated = await requestQwenDraft(params, apiKey, model);
  }

  rememberDraft(generated);
  return generated;
}
