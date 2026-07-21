// 各测试页共用：等 PayPal Web SDK v6 core script 加载完（可能已经命中缓存提前 ready）再执行回调。
export function onPayPalSdkReady(scriptEl, callback) {
    if (window.paypal) {
        callback();
    } else {
        scriptEl.addEventListener("load", callback);
    }
}
