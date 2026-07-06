export const activityConfig = {
  brandName: "深圳汇职驾校",
  activityName: "微信扫码分享打卡",
  heroTitle: "微信扫一扫，完成小红书打卡",
  heroDescription:
    "扫码进入活动页后，系统会自动准备小红书文案和驾校素材。你只需要保存图片、复制文案，再打开小红书完成发布。",
  rewardTitle: "发布成功后领取专属奖励",
  rewardDescription: "工作人员确认发布内容后，将为你登记活动奖励。",
  contactHint: "请向前台或教练出示此页面",
  steps: ["生成打卡文案和配图", "保存图片并复制文案", "打开小红书完成发布", "出示页面领取奖励"],
  rules: [
    "发布内容需与深圳汇职驾校学车体验相关",
    "请保留笔记发布成功页面，用于现场核销",
    "每位用户同一活动仅限领取一次奖励",
  ],
};

export function getSourceLabel(source: string) {
  if (source === "qrcode") return "微信扫码";
  if (source === "nfc") return "NFC碰一碰";
  return "活动入口";
}
