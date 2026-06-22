"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    captureOrder,
    createOrderACDC,
    createOrderACDCWith3DS,
    getOrderDetail,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";

import { useEffect, useRef, useState } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import CardCopyInfo from "@/components/ui/CardCopyInfo";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";

const Three_DS_NO_CARD = {
    cardNo: "4012000077777777",
    cardDate: "12/2027",
    cardCvv: "123",
} as const;

const Three_DS_POSSIBLE_CARD = {
    cardNo: "4012000033330026",
    cardDate: "12/2027",
    cardCvv: "123",
} as const;

export default function CardFields() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isPaying, setIsPaying] = useState(false);
    // 是否走 3DS 强制端点 (createOrderACDCWith3DS, 后端注入 SCA_ALWAYS)
    const [use3DS, setUse3DS] = useState(false);
    // 控制支付期间是否覆盖全屏 loading 遮罩。3DS 会弹 challenge 窗, 遮罩会挡住, 所以
    // 勾选 3DS 时自动关闭 overlay; 用户仍可手动重新打开。
    const [overlayEnabled, setOverlayEnabled] = useState(true);
    // 镜像 use3DS 到 ref, 让 setupCardFields 里 addEventListener 注册的 click handler
    // 能读到最新值 (该 handler 闭包冻结在首次注册时, 直接读 state 会永远是初始值)
    const use3DSRef = useRef(use3DS);
    useEffect(() => {
        use3DSRef.current = use3DS;
    }, [use3DS]);

    // Setup card fields
    async function setupCardFields(sdkInstance: AppSdkInstance) {
        const cardSession =
            //@ts-ignore
            sdkInstance.createCardFieldsOneTimePaymentSession(
                paymentSessionOptions,
            );

        const numberField = cardSession.createCardFieldsComponent({
            type: "number",
            placeholder: "Card number",
        });

        const expiryField = cardSession.createCardFieldsComponent({
            type: "expiry",
            placeholder: "MM/YY",
        });

        const cvvField = cardSession.createCardFieldsComponent({
            type: "cvv",
            placeholder: "CVV",
        });

        document
            .querySelector("#paypal-card-fields-number")!
            .appendChild(numberField);
        document
            .querySelector("#paypal-card-fields-expiry")!
            .appendChild(expiryField);
        document
            .querySelector("#paypal-card-fields-cvv")!
            .appendChild(cvvField);

        const payButton = document.querySelector("#pay-button")!;
        payButton.addEventListener("click", () => onPayClick(cardSession));
    }

    async function onPayClick(cardSession: any) {
        // 防止重复点击 + 在 createOrder / submit / captureOrder 期间盖住整个屏幕
        setIsPaying(true);
        try {
            // get the promise reference by invoking createOrder()
            // do not await this async function since it can cause transient activation issues
            let orderPromise;
            const with3DS = use3DSRef.current;
            console.log("Use 3DS endpoint:", with3DS);
            if (with3DS) {
                orderPromise = await createOrderACDCWith3DS();
            } else {
                orderPromise = await createOrderACDC();
            }

            const { orderId } = orderPromise;

            consola.log("[ACDC Create Order]:orderId:", orderId);
            // debugger;

            const { data, state } = await cardSession.submit(orderId, {
                billingAddress: {
                    postalCode: "95131",
                }, // supply what your business needs
            });

            // debugger;

            switch (state) {
                case "succeeded": {
                    const { orderId, ...liabilityShift } = data;

                    console.log(
                        "liabilityShift:",
                        JSON.stringify(liabilityShift, null, 2),
                    );

                    // 3DS may or may not have occurred; Use liabilityShift
                    // to determine if the payment should be captured

                    // Capture 前先 GET 一次 order，便于排查 3DS 结果 / authentication_result
                    const orderDetail = await getOrderDetail({ orderId });
                    consola.log(
                        "[ACDC Get Order Before Capture]:",
                        JSON.stringify(orderDetail, null, 2),
                    );

                    const capture = await captureOrder({ orderId });

                    // debugger;
                    toast(
                        `Liability Shift: ${JSON.stringify(liabilityShift, null, 2)}`,
                        {
                            icon: "🔺",
                            style: {
                                borderRadius: "10px",
                                background: "#333",
                                color: "#fff",
                            },
                        },
                    );

                    // TODO: show success UI, redirect, etc.
                    break;
                }
                case "canceled": {
                    // Buyer dismissed 3DS modal or canceled the flow
                    // TODO: show non-blocking message & allow retry
                    break;
                }
                case "failed": {
                    // Validation or processing failure. data.message may be present
                    consola.error("Card submission failed", data);
                    // TODO: surface error to buyer, allow retry
                    break;
                }
                default: {
                    // Future-proof for other states (e.g., pending)
                    consola.warn("Unhandled submit state", state, data);
                }
            }
        } catch (err) {
            consola.error("Payment flow error", err);
            // TODO: Show generic error and allow retry
        } finally {
            // captureOrder 完成 / 报错 / canceled / failed —— 任何分支都解除遮罩
            setIsPaying(false);
        }
    }

    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;

        if (!ready) return;

        (async () => {
            try {
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    initOptions,
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["card-fields"],
                });

                if (!true) {
                    // if (true) {
                    // ####################### 进行eligibility check ###############################

                    // Check eligibility for all payment methods
                    const paymentMethods =
                        await safeFindEligibleMethods(sdkInstance);
                    if (!paymentMethods) return;

                    consola.log(JSON.stringify(paymentMethods, null, "  "));

                    // [ATTENTION!]这里不一样了
                    if (paymentMethods.isEligible("advanced_cards")) {
                        setupCardFields(sdkInstance);
                    }

                    // ############################################################################
                } else {
                    setupCardFields(sdkInstance);
                }

                if (cancelled) {
                    // 如果实例需要销毁，按需处理
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex flex-col gap-4">
            <CardCopyInfo
                cardNo={Three_DS_NO_CARD.cardNo}
                cardDate={Three_DS_NO_CARD.cardDate}
                cardCvv={Three_DS_NO_CARD.cardCvv}
                title="3D Secure - No"
            />

            <CardCopyInfo
                cardNo={Three_DS_POSSIBLE_CARD.cardNo}
                cardDate={Three_DS_POSSIBLE_CARD.cardDate}
                cardCvv={Three_DS_POSSIBLE_CARD.cardCvv}
                title="3D Secure - Possible"
            />

            <label
                htmlFor="acdc-3ds-toggle"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-slate-200 px-4 py-3 transition-colors hover:bg-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
                <Checkbox
                    id="acdc-3ds-toggle"
                    checked={use3DS}
                    onCheckedChange={(v) => {
                        const next = v === true;
                        setUse3DS(next);
                        // 勾选 3DS 时自动关闭 overlay, 否则遮罩会挡住 challenge 弹窗。
                        // 取消勾选时不动 overlay, 让用户保留自己的偏好。
                        if (next) setOverlayEnabled(false);
                    }}
                    className="size-5 border-2 border-slate-500 bg-white dark:bg-slate-900"
                />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Use 3DS
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        Checked: call createOrderACDCWith3DS (backend forces
                        SCA_ALWAYS). Unchecked: call createOrderACDC (no
                        forced SCA). Checking this auto-disables Loading
                        Overlay so the 3DS challenge popup is not blocked.
                    </span>
                </div>
            </label>

            <label
                htmlFor="acdc-overlay-toggle"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-slate-200 px-4 py-3 transition-colors hover:bg-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
                <Checkbox
                    id="acdc-overlay-toggle"
                    checked={overlayEnabled}
                    onCheckedChange={(v) => setOverlayEnabled(v === true)}
                    className="size-5 border-2 border-slate-500 bg-white dark:bg-slate-900"
                />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Loading Overlay
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        Checked: show full-screen overlay during payment.
                        Disable when Use 3DS is on so the challenge popup
                        is not blocked.
                    </span>
                </div>
            </label>

            <div className="flex flex-col gap-1">
                <div
                    className="card-field"
                    id="paypal-card-fields-number"
                ></div>
                <div
                    className="card-field"
                    id="paypal-card-fields-expiry"
                ></div>
                <div className="card-field" id="paypal-card-fields-cvv"></div>
                <button id="pay-button" className="acdc-pay-button">
                    Pay
                </button>
            </div>

            {isPaying && overlayEnabled && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"
                    aria-live="polite"
                    aria-busy="true"
                >
                    <div className="flex items-center gap-3 rounded-full border border-white/15 bg-slate-900/85 px-5 py-3 text-sm text-white shadow-lg shadow-slate-950/30">
                        <Spinner className="size-4 text-white" />
                        <span>Processing payment…</span>
                    </div>
                </div>
            )}
        </div>
    );
}