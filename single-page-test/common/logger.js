// 各测试页共用的日志面板：在 <div id="log"> 里追加带层级颜色的日志条目。
const LEVEL_STYLES = {
    info: "text-sky-400",
    success: "text-emerald-400",
    error: "text-rose-400",
};

export function createLogger(logElId = "log") {
    const logEl = document.getElementById(logElId);

    function log(label, data, level = "info") {
        console.log(label, data ?? "");
        if (!logEl) return;

        const entry = document.createElement("div");
        entry.className =
            "border-b border-gray-800 pb-2 last:border-0 last:pb-0";

        const labelEl = document.createElement("div");
        labelEl.className = `text-xs font-semibold ${LEVEL_STYLES[level] ?? LEVEL_STYLES.info}`;
        labelEl.textContent = label;
        entry.appendChild(labelEl);

        if (data !== undefined) {
            const pre = document.createElement("pre");
            pre.className =
                "mt-1 text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words";
            pre.textContent =
                typeof data === "string" ? data : JSON.stringify(data, null, 2);
            entry.appendChild(pre);
        }

        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function clear() {
        if (logEl) logEl.innerHTML = "";
    }

    return { log, clear };
}
