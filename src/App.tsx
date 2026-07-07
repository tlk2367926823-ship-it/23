import { Check, ChevronRight, Clipboard, Gift, Loader2, RefreshCw, Send, Share2, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { activityConfig, getSourceLabel } from "./activityConfig";
import { clearShareState, createClaimCode, saveShareState } from "./localState";
import { mockAssets, selectAsset } from "./mockAssets";
import { CopyPublisher, DeeplinkPublisher, MockPublisher, NativeSharePublisher, XhsSchemePublisher } from "./publishers";
import { generateShareDraft } from "./qwen";
import type { AppStep, MockAsset, ShareDraft, SharePlatform } from "./types";

const progressSteps = ["分析活动入口", "生成小红书标题", "匹配分享素材", "整理发布草稿"];

const platformOptions: Array<{ id: SharePlatform; label: string; hint: string }> = [
  { id: "redbook", label: "小红书", hint: "图文种草" },
  { id: "meituan", label: "美团", hint: "门店评价" },
  { id: "dianping", label: "大众点评", hint: "探店评价" },
];

function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function isAndroidBrowser() {
  const previewMode = new URLSearchParams(window.location.search).get("preview");
  if (previewMode === "android") return true;
  return /Android/i.test(navigator.userAgent);
}

function useCampaign() {
  return useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return {
      source: search.get("source") || "nfc",
      campaign: search.get("campaign") || "huizhi-share",
    };
  }, []);
}

function formatCopy(draft: ShareDraft) {
  return `${draft.title}\n\n${draft.body}\n\n${draft.tags.map((tag) => `#${tag}`).join(" ")}`;
}

function getDownloadName(url: string) {
  const cleanUrl = url.split("?")[0];
  return cleanUrl.split("/").pop() || "huizhi-share.png";
}

function isReviewPlatform(platform: SharePlatform) {
  return platform === "meituan" || platform === "dianping";
}

function getReviewPlatformName(platform: SharePlatform) {
  return platform === "meituan" ? "美团" : "大众点评";
}

function getPlatformPayload(draft: ShareDraft, platform: SharePlatform) {
  if (isReviewPlatform(platform)) {
    return {
      title: "深圳汇职驾校学车体验",
      body: `${draft.body}\n\n整体体验比较真实，适合正在深圳准备学车、想先了解训练场和教练服务的朋友参考。`,
      tags: ["深圳驾校", "汇职驾校", "学车体验", "驾校点评"],
    };
  }

  return {
    title: draft.title,
    body: draft.body,
    tags: draft.tags,
  };
}

export default function App() {
  const campaign = useCampaign();
  const isWechat = useMemo(() => isWechatBrowser(), []);
  const isAndroid = useMemo(() => isAndroidBrowser(), []);
  const [step, setStep] = useState<AppStep>("intro");
  const [draft, setDraft] = useState<ShareDraft | null>(null);
  const [asset, setAsset] = useState<MockAsset>(mockAssets[0]);
  const [assetCursor, setAssetCursor] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<SharePlatform>("redbook");
  const [published, setPublished] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [publishedAt, setPublishedAt] = useState("");

  useEffect(() => {
    clearShareState();
  }, []);

  async function handleGenerate() {
    setStep("generating");
    setError("");
    setCopied(false);
    setLoadingIndex(0);

    const timer = window.setInterval(() => {
      setLoadingIndex((index) => Math.min(index + 1, progressSteps.length - 1));
    }, 520);

    try {
      const generated = await generateShareDraft(campaign);
      const selected = selectAsset(generated, 0);
      setDraft(generated);
      setAsset(selected);
      setAssetCursor(0);
      setClaimCode("");
      setPublishedAt("");
      setPublished(false);
      saveShareState({ draft: generated, asset: selected, claimCode: "", publishedAt: "" });
      window.setTimeout(() => setStep("result"), 450);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试");
    } finally {
      window.clearInterval(timer);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    setPublishMessage("");
    const publisher = new CopyPublisher();
    const platformPayload = getPlatformPayload(draft, sharePlatform);
    const result = await publisher.publish({
      ...platformPayload,
      assets: [asset.url],
    });
    setCopied(result.success);
    if (step === "publish") {
      setPublishMessage(
        result.success
          ? isReviewPlatform(sharePlatform)
            ? `${getReviewPlatformName(sharePlatform)}评价文案已复制，到 App 后长按粘贴即可。`
            : "全部文案已复制，到小红书后长按粘贴即可。"
          : result.message || "当前浏览器不支持自动复制，请手动复制文案。",
      );
    }
  }

  async function preparePublishMaterials() {
    await copyDraft();
    downloadCurrentAsset();
    setPublishMessage(
      isReviewPlatform(sharePlatform)
        ? `${getReviewPlatformName(sharePlatform)}评价文案已复制，图片已开始保存。保存完成后点击“打开${getReviewPlatformName(sharePlatform)}”。`
        : "全部文案已复制，图片已开始保存。保存完成后点击“一键发布小红书”。",
    );
  }

  function switchAsset() {
    if (!draft) return;
    const nextCursor = assetCursor + 1;
    const nextAsset = selectAsset(draft, nextCursor);
    setAsset(nextAsset);
    setAssetCursor(nextCursor);
    saveShareState({ draft, asset: nextAsset });
  }

  function downloadCurrentAsset() {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = getDownloadName(asset.url);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function prepareAndroidAsset() {
    if (!draft) return;
    setPublishMessage("");

    const payload = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    };

    try {
      await new CopyPublisher().publish(payload);
      setCopied(true);
      downloadCurrentAsset();
      setPublishMessage("文案已复制，图片已开始保存。请等手机提示下载完成后，再点击“我已保存，打开相册发布”。");
    } catch {
      setPublishMessage("图片已开始保存。如文案没有自动复制，请先点“复制小红书文案”。");
    }
  }

  async function openAndroidAlbumAfterSaved() {
    if (!draft) return;
    setPublishMessage("");

    const payload = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    };

    try {
      await new CopyPublisher().publish(payload);
      setCopied(true);
      const deeplinkResult = await new DeeplinkPublisher().publish(payload);
      setPublishMessage(
        deeplinkResult.success
          ? "正在尝试打开小红书相册发布入口。进入后选择刚保存的图片，并粘贴文案。"
          : "请在浏览器打开活动页后继续跳转小红书。",
      );
      window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await new XhsSchemePublisher().publish(payload);
          setPublishMessage("正在换一种方式尝试打开小红书相册发布入口。");

          window.setTimeout(async () => {
            if (document.visibilityState === "visible") {
              await new DeeplinkPublisher("home").publish(payload);
              setPublishMessage("相册入口未打开时，正在改为打开小红书 App 首页。进入后点底部 + 发布。");
            }
          }, 1600);
        }
      }, 1400);
    } catch {
      setPublishMessage("文案已复制。如果发布入口打不开，请手动打开小红书点底部 + 发布。");
    }
  }

  async function androidSystemShareFirst() {
    if (!draft) return;
    setPublishMessage("");

    const payload = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    };

    try {
      await new CopyPublisher().publish(payload);
      setCopied(true);
      const shareResult = await new NativeSharePublisher().publish(payload);

      if (shareResult.success) {
        setPublishMessage("文案已复制，已调起系统分享。请选择小红书；如果没有进入发布页，会继续尝试打开相册入口。");
        window.setTimeout(async () => {
          if (document.visibilityState === "visible") {
            await openAndroidAlbumAfterSaved();
          }
        }, 2500);
        return;
      }

      await openAndroidAlbumAfterSaved();
    } catch {
      await openAndroidAlbumAfterSaved();
    }
  }

  async function openReviewPlatformPublish(platform: Extract<SharePlatform, "meituan" | "dianping">) {
    if (!draft) return;
    setPublishMessage("");
    const platformName = getReviewPlatformName(platform);
    const platformPayload = getPlatformPayload(draft, platform);

    await new CopyPublisher().publish({
      ...platformPayload,
      assets: [asset.url],
    });
    setCopied(true);
    setPublishMessage(`${platformName}评价文案已复制。正在打开${platformName}，请找到深圳汇职驾校门店后粘贴发布评价。`);

    window.location.href = platform === "meituan" ? "imeituan://www.meituan.com" : "dianping://";

    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.href =
          platform === "meituan"
            ? "https://www.meituan.com/s/%E6%B7%B1%E5%9C%B3%E6%B1%87%E8%81%8C%E9%A9%BE%E6%A0%A1/"
            : "https://www.dianping.com/search/keyword/7/0_%E6%B7%B1%E5%9C%B3%E6%B1%87%E8%81%8C%E9%A9%BE%E6%A0%A1";
        setPublishMessage(`App 未打开时，已改为打开${platformName}网页。请搜索门店后粘贴评价。`);
      }
    }, 1700);
  }

  async function openTextNoteFallback() {
    if (!draft) return;
    const payload = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    };
    await new CopyPublisher().publish(payload);
    setCopied(true);
    await new DeeplinkPublisher("note").publish(payload);
    setPublishMessage("文案已复制，正在打开小红书文字发布界面。进入后直接粘贴文案即可。");
  }

  async function nativeShareToRedbook() {
    if (!draft) return;
    setPublishMessage("");

    const payload = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    };

    try {
      const result = await new NativeSharePublisher().publish(payload);

      if (!result.success) {
        await new CopyPublisher().publish(payload);
        const deeplinkResult = await new DeeplinkPublisher().publish(payload);
        setCopied(true);
        setPublishMessage(deeplinkResult.success ? "文案已复制，正在打开小红书。" : "文案已复制，请用浏览器打开后继续。");
        return;
      }

      setPublishMessage("");
    } catch (err) {
      await new CopyPublisher().publish(payload);
      const deeplinkResult = await new DeeplinkPublisher().publish(payload);
      setCopied(true);
      setPublishMessage(deeplinkResult.success ? "文案已复制，正在打开小红书。" : "文案已复制，请用浏览器打开后继续。");
    }
  }

  async function openRedbook() {
    if (!draft) return;
    if (isAndroid) {
      await openAndroidAlbumAfterSaved();
      return;
    }
    await copyDraft();
    await new DeeplinkPublisher().publish({
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    });
  }

  async function recommendedPublish() {
    if (sharePlatform === "meituan" || sharePlatform === "dianping") {
      await openReviewPlatformPublish(sharePlatform);
      return;
    }

    if (isAndroid) {
      await androidSystemShareFirst();
      return;
    }
    await nativeShareToRedbook();
  }

  async function finishPublish() {
    setPublished(false);
    const result = await new MockPublisher().publish({
      title: draft?.title || "",
      body: draft?.body || "",
      tags: draft?.tags || [],
      assets: [asset.url],
    });
    const nextClaimCode = createClaimCode(campaign.source);
    const nextPublishedAt = new Date().toLocaleString("zh-CN", { hour12: false });
    setClaimCode(nextClaimCode);
    setPublishedAt(nextPublishedAt);
    setPublished(result.success);
    saveShareState({ draft, asset, claimCode: nextClaimCode, publishedAt: nextPublishedAt });
    setStep("reward");
  }

  function restartActivity() {
    clearShareState();
    setDraft(null);
    setAsset(mockAssets[0]);
    setAssetCursor(0);
    setCopied(false);
    setPublished(false);
    setClaimCode("");
    setPublishedAt("");
    setPublishMessage("");
    setStep("intro");
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div>
            <span className="eyebrow">深圳汇职驾校</span>
            <strong>{activityConfig.activityName}</strong>
          </div>
          <div className="source-pill">{getSourceLabel(campaign.source)}</div>
        </header>

        {step === "intro" && (
          <section className="screen intro-screen">
            {isAndroid && (
              <div className="browser-tip browser-tip-primary">
                <strong>安卓端需要在浏览器打开</strong>
                <span>如果当前在微信里，请点右上角 ...，选择“在浏览器打开”。后面保存图片和打开小红书会更稳定。</span>
              </div>
            )}

            <div className="hero-media">
              <img src="/mock-assets/activity-poster.svg" alt="深圳汇职驾校活动主视觉" />
              <div className="hero-badge">
                <Sparkles size={16} />
                AI 自动生成
              </div>
            </div>

            <div className="hero-copy">
              <h1>{activityConfig.heroTitle}</h1>
              <p>{activityConfig.heroDescription}</p>
            </div>

            <div className="benefit-grid">
              <div>
                <strong>扫码进</strong>
                <span>直接进入活动</span>
              </div>
              <div>
                <strong>自动备好</strong>
                <span>文案和图片</span>
              </div>
              <div>
                <strong>去打卡</strong>
                <span>发布后领奖</span>
              </div>
            </div>

            <div className="info-panel">
              <div className="panel-title">参与流程</div>
              {activityConfig.steps.map((item, index) => (
                <div className="info-row" key={item}>
                  <span>{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="rule-panel">
              <div className="panel-title">活动规则</div>
              {activityConfig.rules.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>
        )}

        {step === "generating" && (
          <section className="screen generating-screen">
            <div className="orbital-loader">
              <Loader2 size={44} />
            </div>
            <h2>正在准备你的分享草稿</h2>
            <p>通义千问正在结合深圳本地学车场景生成内容。</p>

            <div className="progress-card">
              {progressSteps.map((item, index) => (
                <div className={`progress-row ${index <= loadingIndex ? "active" : ""}`} key={item}>
                  <span>{index < loadingIndex ? <Check size={15} /> : index + 1}</span>
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="error-box">
                <strong>生成遇到问题</strong>
                <span>{error}</span>
                <button onClick={handleGenerate}>重新生成</button>
              </div>
            )}
          </section>
        )}

        {step === "result" && draft && (
          <section className="screen result-screen">
            <div className="preview-card">
              <img src={asset.url} alt={asset.title} />
              <div className="asset-caption">
                <span>{asset.title}</span>
                <div className="asset-actions">
                  <button onClick={downloadCurrentAsset}>
                    <Sparkles size={15} />
                    保存图片
                  </button>
                  <button onClick={switchAsset}>
                    <RefreshCw size={15} />
                    换一组
                  </button>
                </div>
              </div>
            </div>

            <article className="draft-card">
              <span className="eyebrow">打卡内容已生成</span>
              <h2>{draft.title}</h2>
              <p>{draft.body}</p>
              <div className="tag-list">
                {draft.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <div className="draft-meta">
                <span>{activityConfig.brandName}</span>
                <span>{asset.tone}</span>
              </div>
            </article>

            <div className="platform-panel">
              <span className="eyebrow">选择发布平台</span>
              <div className="platform-toggle">
                {platformOptions.map((platform) => (
                  <button
                    className={sharePlatform === platform.id ? "active" : ""}
                    key={platform.id}
                    onClick={() => {
                      setSharePlatform(platform.id);
                      setCopied(false);
                      setPublishMessage("");
                    }}
                  >
                    <strong>{platform.label}</strong>
                    <span>{platform.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="action-row">
              <button className="secondary-button" onClick={copyDraft}>
                <Clipboard size={18} />
                {copied ? "已复制" : "复制文案"}
              </button>
              <button className="secondary-button" onClick={handleGenerate}>
                <Wand2 size={18} />
                重新生成
              </button>
            </div>
          </section>
        )}

        {step === "publish" && draft && (
          <section className="screen publish-screen">
            <div className="publish-hero">
              {isAndroid ? <Send size={30} /> : <Share2 size={30} />}
              <h2>
                {sharePlatform === "dianping"
                  ? "同步到大众点评"
                  : sharePlatform === "meituan"
                    ? "同步到美团"
                  : isAndroid
                    ? "安卓系统分享发布"
                    : "手机端一键分享到小红书"}
              </h2>
              <p>
                {isReviewPlatform(sharePlatform)
                  ? `先复制评价文案并保存图片，再打开${getReviewPlatformName(sharePlatform)}搜索门店，由用户本人确认发布评价。`
                  : isAndroid
                    ? "优先调用手机系统分享，把图片交给小红书。若系统分享不可用，再保存图片并打开小红书相册发布。"
                    : "客户试用时请用手机打开活动页。优先使用系统分享；也可以直接尝试打开小红书 App 的发布入口。"}
              </p>
            </div>

            <div className="publish-steps">
              {isAndroid && (
                <button className="recommended-step" onClick={preparePublishMaterials}>
                  <Clipboard size={20} />
                  <span>
                    {copied
                      ? "文案和图片已准备"
                      : isReviewPlatform(sharePlatform)
                        ? "复制评价文案并保存图片"
                        : "复制文案并保存图片"}
                  </span>
                  <ChevronRight size={18} />
                </button>
              )}
              <button className={isAndroid ? "" : "recommended-step"} onClick={recommendedPublish}>
                <Send size={20} />
                <span>去发布</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {publishMessage && <div className="publish-message">{publishMessage}</div>}

            <button className="done-button" onClick={finishPublish}>我已发布，领取奖励</button>
          </section>
        )}

        {step === "reward" && (
          <section className="screen reward-screen">
            <div className="reward-card">
              <div className="reward-icon">
                <Gift size={42} />
              </div>
              <span className="eyebrow">{published ? "发布完成" : "活动奖励"}</span>
              <h2>{activityConfig.contactHint}</h2>
              <p>{activityConfig.rewardDescription}感谢你分享深圳汇职驾校的学车体验。</p>
              <div className="reward-code">{claimCode || `HZ-${new Date().getFullYear()}-${campaign.source.toUpperCase()}`}</div>
              <div className="reward-detail">
                <span>入口：{getSourceLabel(campaign.source)}</span>
                <span>时间：{publishedAt || "待确认"}</span>
                <span>状态：{published ? "待工作人员核销" : "待发布确认"}</span>
              </div>
            </div>
          </section>
        )}

        <footer className="bottom-cta">
          {step === "intro" && (
            <button className="primary-button" onClick={handleGenerate}>
              开始分享打卡
              <ChevronRight size={20} />
            </button>
          )}
          {step === "result" && (
            <button className="primary-button" onClick={() => setStep("publish")}>
              去小红书发布
              <ChevronRight size={20} />
            </button>
          )}
          {step === "reward" && (
            <button className="primary-button" onClick={restartActivity}>
              重新开始
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
      </div>

      <aside className="desktop-note">
        <strong>Mobile Web App Preview</strong>
        <span>请使用手机尺寸查看最佳体验。</span>
        <textarea readOnly value={draft ? formatCopy(draft) : "生成后这里会同步展示可复制文案。"} />
      </aside>
    </main>
  );
}



