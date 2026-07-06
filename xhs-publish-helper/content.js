(function () {
  const DRAFT_HASH_KEY = "huizhiDraft";
  const NOTICE_ID = "huizhi-xhs-autofill-notice";

  function decodeDraftFromHash() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const encoded = hash.get(DRAFT_HASH_KEY);
    if (!encoded) return null;

    try {
      return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))));
    } catch (error) {
      console.warn("[汇职发布助手] 草稿解析失败", error);
      return null;
    }
  }

  function formatBody(draft) {
    const tags = Array.isArray(draft.tags) ? draft.tags.map((tag) => `#${tag}`).join(" ") : "";
    return `${draft.body || ""}\n\n${tags}`.trim();
  }

  function visible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function dispatchInput(element) {
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: element.value || element.innerText || "" }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setText(element, value) {
    element.focus();

    if (element.isContentEditable) {
      element.innerText = value;
      dispatchInput(element);
      return true;
    }

    if ("value" in element) {
      element.value = value;
      dispatchInput(element);
      return true;
    }

    return false;
  }

  function getFieldHint(element) {
    return [
      element.getAttribute("placeholder"),
      element.getAttribute("aria-label"),
      element.getAttribute("data-placeholder"),
      element.getAttribute("class"),
      element.getAttribute("name"),
      element.textContent,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function findEditableFields() {
    return Array.from(document.querySelectorAll("input, textarea, [contenteditable='true'], [contenteditable='plaintext-only']"))
      .filter(visible)
      .filter((element) => {
        const type = element.getAttribute("type");
        return !type || !["file", "hidden", "checkbox", "radio"].includes(type);
      });
  }

  function scoreTitleField(element) {
    const hint = getFieldHint(element);
    let score = 0;
    if (hint.includes("标题")) score += 8;
    if (hint.includes("title")) score += 6;
    if (element.tagName === "INPUT") score += 3;
    if (element.getAttribute("maxlength")) score += 1;
    return score;
  }

  function scoreBodyField(element) {
    const hint = getFieldHint(element);
    const rect = element.getBoundingClientRect();
    let score = 0;
    if (hint.includes("正文")) score += 8;
    if (hint.includes("描述")) score += 7;
    if (hint.includes("内容")) score += 7;
    if (hint.includes("分享")) score += 4;
    if (hint.includes("description")) score += 6;
    if (element.tagName === "TEXTAREA") score += 4;
    if (element.isContentEditable) score += 3;
    if (rect.height > 80) score += 3;
    return score;
  }

  function bestByScore(fields, scorer, exclude) {
    return fields
      .filter((field) => field !== exclude)
      .map((field) => ({ field, score: scorer(field) }))
      .sort((a, b) => b.score - a.score)[0];
  }

  function showNotice(message, tone = "ok") {
    let notice = document.getElementById(NOTICE_ID);
    if (!notice) {
      notice = document.createElement("div");
      notice.id = NOTICE_ID;
      document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.style.cssText = [
      "position: fixed",
      "right: 20px",
      "bottom: 20px",
      "z-index: 2147483647",
      "max-width: 360px",
      "padding: 14px 16px",
      "border-radius: 12px",
      "box-shadow: 0 12px 34px rgba(0,0,0,.18)",
      "font: 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif",
      "color: #fff",
      `background: ${tone === "ok" ? "#17201b" : "#b42318"}`,
    ].join(";");

    window.setTimeout(() => notice.remove(), 6000);
  }

  function looksLikeUploadGate() {
    const text = document.body.innerText || "";
    return text.includes("拖拽视频到此") || text.includes("点击上传") || text.includes("上传图文") || text.includes("上传视频");
  }

  async function autofill(draft, options = {}) {
    const maxAttempts = options.maxAttempts || 300;
    const silentWaiting = options.silentWaiting || false;

    if (!silentWaiting && looksLikeUploadGate()) {
      showNotice("草稿已收到。请先上传图片/视频，标题和正文输入框出现后会自动填入。");
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const fields = findEditableFields();
      const titleMatch = bestByScore(fields, scoreTitleField);
      const bodyMatch = bestByScore(fields, scoreBodyField, titleMatch?.field);

      if (titleMatch?.field && bodyMatch?.field && titleMatch.score > 0 && bodyMatch.score > 0) {
        setText(titleMatch.field, draft.title || "");
        setText(bodyMatch.field, formatBody(draft));
        showNotice("汇职分享草稿已填入。请检查内容、上传素材后手动点击发布。");
        return true;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    showNotice("等待超时：仍未识别到标题和正文输入框。请确认素材已上传并停留在编辑页面。", "error");
    return false;
  }

  function watchEditor(draft) {
    let filled = false;
    const observer = new MutationObserver(() => {
      if (filled) return;
      const fields = findEditableFields();
      const titleMatch = bestByScore(fields, scoreTitleField);
      const bodyMatch = bestByScore(fields, scoreBodyField, titleMatch?.field);

      if (titleMatch?.field && bodyMatch?.field && titleMatch.score > 0 && bodyMatch.score > 0) {
        filled = true;
        observer.disconnect();
        setText(titleMatch.field, draft.title || "");
        setText(bodyMatch.field, formatBody(draft));
        showNotice("汇职分享草稿已自动填入。请检查素材和内容后手动点击发布。");
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.setTimeout(() => observer.disconnect(), 10 * 60 * 1000);
  }

  const draft = decodeDraftFromHash();
  if (draft) {
    chrome.storage.local.set({ huizhiLastDraft: draft }).catch(() => {});
    watchEditor(draft);
    autofill(draft);
  }
})();
