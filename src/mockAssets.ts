import type { MockAsset, ShareDraft } from "./types";

export const mockAssets: MockAsset[] = [
  {
    id: "huizhi-car-yard-01",
    type: "image",
    title: "训练场教练车实拍",
    keywords: ["练车", "训练场", "教练车", "深圳驾校", "汇职驾校"],
    url: "/mock-assets/huizhi-car-yard-01.jpg",
    tone: "真实、场地感强",
  },
  {
    id: "huizhi-training-base-02",
    type: "image",
    title: "深职院驾驶技能实训基地",
    keywords: ["训练场", "基地", "场地", "练车", "深圳学车"],
    url: "/mock-assets/huizhi-training-base-02.jpg",
    tone: "专业、可信赖",
  },
  {
    id: "huizhi-practice-car-03",
    type: "image",
    title: "汇职教练车练习场景",
    keywords: ["教练车", "练车", "新手", "训练场", "科目二"],
    url: "/mock-assets/huizhi-practice-car-03.jpg",
    tone: "清晰、有练车氛围",
  },
  {
    id: "huizhi-driving-closeup-04",
    type: "image",
    title: "学员上车练习近景",
    keywords: ["学员", "上车", "新手", "体验", "教练"],
    url: "/mock-assets/huizhi-driving-closeup-04.jpg",
    tone: "真实、像学员分享",
  },
  {
    id: "huizhi-coach-guidance-05",
    type: "image",
    title: "教练现场指导练车",
    keywords: ["教练", "指导", "陪练", "练车", "服务"],
    url: "/mock-assets/huizhi-coach-guidance-05.jpg",
    tone: "服务感、陪伴感",
  },
];

export function selectAsset(draft: ShareDraft, cursor = 0): MockAsset {
  const text = `${draft.title} ${draft.body} ${draft.tags.join(" ")}`;
  const candidates = mockAssets
    .filter((asset) => asset.type === draft.materialType || draft.materialType === "image")
    .map((asset) => ({
      asset,
      score: asset.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const ranked = candidates.length > 0 ? candidates : mockAssets.map((asset) => ({ asset, score: 0 }));
  return ranked[cursor % ranked.length].asset;
}
