import type { PublishPayload, PublishResult, Publisher } from "./types";

function getShareText(payload: PublishPayload) {
  return `${payload.body}\n\n${payload.tags.map((tag) => `#${tag}`).join(" ")}`;
}

function getFullShareText(payload: PublishPayload) {
  return `${payload.title}\n\n${getShareText(payload)}`;
}

function getFileName(url: string) {
  const cleanUrl = url.split("?")[0];
  return cleanUrl.split("/").pop() || "huizhi-share.png";
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getXhsScheme(payload: PublishPayload) {
  const isVideo = payload.assets.some((asset) => /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(asset));
  return isVideo ? "xhsdiscover://post_video_album/" : "xhsdiscover://post/";
}

function getXhsTextNoteScheme() {
  return "xhsdiscover://post_note/";
}

function getXhsHomeScheme() {
  return "xhsdiscover://home";
}

function getXhsAndroidIntent(payload: PublishPayload, target: "album" | "note" | "home") {
  if (target === "home") {
    const fallback = encodeURIComponent("https://www.xiaohongshu.com");
    return `intent://home#Intent;scheme=xhsdiscover;package=com.xingin.xhs;S.browser_fallback_url=${fallback};end`;
  }

  if (target === "note") {
    const fallback = encodeURIComponent("https://www.xiaohongshu.com");
    return `intent://post_note/#Intent;scheme=xhsdiscover;package=com.xingin.xhs;S.browser_fallback_url=${fallback};end`;
  }

  const isVideo = payload.assets.some((asset) => /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(asset));
  const path = isVideo ? "post_video_album/" : "post/";
  const fallback = encodeURIComponent("https://www.xiaohongshu.com");
  return `intent://${path}#Intent;scheme=xhsdiscover;package=com.xingin.xhs;S.browser_fallback_url=${fallback};end`;
}

async function assetToFile(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("素材读取失败");
  }

  const blob = await response.blob();
  const mime = blob.type || "image/png";
  return new File([blob], getFileName(url), { type: mime });
}

export class CopyPublisher implements Publisher {
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const text = `${payload.title}\n\n${payload.body}\n\n${payload.tags.map((tag) => `#${tag}`).join(" ")}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true, mode: "copy", message: "文案已复制" };
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    return {
      success: copied,
      mode: "copy",
      message: copied ? "文案已复制" : "当前浏览器不支持自动复制，请手动复制文案",
    };
  }
}

export class DeeplinkPublisher implements Publisher {
  constructor(private target: "album" | "note" | "home" = "album") {}

  async publish(payload: PublishPayload): Promise<PublishResult> {
    const appUrl = isAndroid()
      ? getXhsAndroidIntent(payload, this.target)
      : this.target === "home"
        ? getXhsHomeScheme()
        : this.target === "note"
          ? getXhsTextNoteScheme()
          : getXhsScheme(payload);

    let shouldFallback = true;
    const cancelFallback = () => {
      shouldFallback = false;
    };

    window.addEventListener("pagehide", cancelFallback, { once: true });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) cancelFallback();
      },
      { once: true },
    );

    if (!isAndroid() && !isIos()) {
      return {
        success: false,
        mode: "deeplink",
        message: "当前不是手机浏览器，请用安卓或 iPhone 打开活动页。",
      };
    }

    window.location.href = appUrl;

    window.setTimeout(() => {
      if (shouldFallback) {
        shouldFallback = false;
      }
    }, isAndroid() ? 1600 : 1300);

    return {
      success: true,
      mode: "deeplink",
      message:
        this.target === "home"
          ? "文案已复制，正在打开小红书"
          : this.target === "note"
          ? "文案已复制，正在打开小红书文字发布界面"
          : isAndroid()
            ? "文案已复制，正在打开小红书发布入口"
            : "正在尝试打开 iPhone 小红书发布入口",
    };
  }
}

export class XhsSchemePublisher implements Publisher {
  constructor(private target: "album" | "note" | "home" = "album") {}

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!isAndroid() && !isIos()) {
      return {
        success: false,
        mode: "deeplink",
        message: "当前不是手机浏览器，请用安卓或 iPhone 打开活动页。",
      };
    }

    const appUrl =
      this.target === "home"
        ? getXhsHomeScheme()
        : this.target === "note"
          ? getXhsTextNoteScheme()
          : getXhsScheme(payload);

    window.location.href = appUrl;

    return {
      success: true,
      mode: "deeplink",
      message:
        this.target === "home"
          ? "正在打开小红书"
          : this.target === "note"
            ? "正在打开小红书文字发布界面"
            : "正在尝试打开小红书相册发布入口",
    };
  }
}

export class NativeSharePublisher implements Publisher {
  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!navigator.share) {
      return {
        success: false,
        mode: "native-share",
        message: "当前浏览器不支持系统分享",
      };
    }

    const files = await Promise.all(payload.assets.map(assetToFile));
    const shareData: ShareData = {
      title: payload.title,
      text: getShareText(payload),
      files,
    };

    if (files.length > 0 && navigator.canShare && !navigator.canShare(shareData)) {
      await navigator.share({
        title: payload.title,
        text: getFullShareText(payload),
      });
      return { success: true, mode: "native-share", message: "已调起系统分享，素材需手动选择" };
    }

    await navigator.share(shareData);
    return { success: true, mode: "native-share", message: "已调起系统分享" };
  }
}

export class MockPublisher implements Publisher {
  async publish(_payload: PublishPayload): Promise<PublishResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return { success: true, mode: "mock", message: "模拟发布完成" };
  }
}

