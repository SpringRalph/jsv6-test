"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrderBCDC,
    createOrderOverallPayPal,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";

import { useEffect } from "react";
import consola from "consola";

export default function BCDCInline() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

    // Setup BCDC button
    async function setupBCDCButton(
        bcdcButton: Element,
        paypalGuestPaymentSession: any,
        createOrderPromise: Promise<string>,
    ) {
        bcdcButton.addEventListener("click", async () => {
            try {
                await startGuestPaymentSession(
                    bcdcButton,
                    paypalGuestPaymentSession,
                    createOrderPromise,
                );
            } catch (error) {
                consola.error("PayPal BCDC payment start error:", error);
                handlePaymentError(error);
            }
        });
    }

    async function startGuestPaymentSession(
        checkoutButton: Element,
        paypalGuestPaymentSession: any,
        createOrderPromise: Promise<string>,
    ) {
        await paypalGuestPaymentSession.start(
            { targetElement: checkoutButton, presentationMode: "auto" }, // Auto-detects best presentation mode
            createOrderPromise,
        );
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
                    "initOptions:",
                    initOptions,
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    //这里是BCDC和普通的最大不同
                    components: ["paypal-guest-payments"],
                    pageType: "checkout",
                    testBuyerCountry: "US",
                });

                const paypalGuestPaymentSession =
                    //@ts-ignore
                    sdkInstance.createPayPalGuestOneTimePaymentSession(
                        paymentSessionOptions,
                    );

                const bcdcButton = document.querySelector(
                    "#paypal-basic-card-button",
                )!;

                // get the promise reference by invoking createOrder()
                // do not await this async function since it can cause transient activation issues
                
                
                const createOrderPromise = createOrderOverallPayPal("/api/paypal/order/create/create-order-bcdc-with-more-info");


                //因为进行eligibility check有的时候会出现bug, 所以通过flag来控制是否进行eligibilty check
                // if (!true) {
                if (true) {
                    // ####################### 进行eligibility check ###############################

                    // Check eligibility for all payment methods
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods({
                            currencyCode: "USD",
                        });


                    //Auto-render
                    await startGuestPaymentSession(
                        bcdcButton,
                        paypalGuestPaymentSession,
                        createOrderPromise,
                    );

                    await setupBCDCButton(
                        bcdcButton,
                        paypalGuestPaymentSession,
                        createOrderPromise,
                    );

                    // ############################################################################
                } else {
                    // ####################### 不进行eligibility check, 直接渲染按钮 ###############################
                    await setupBCDCButton(
                        bcdcButton,
                        paypalGuestPaymentSession,
                        createOrderPromise,
                    );
                    // ############################################################################################
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
        <paypal-basic-card-container className="w-full min-h-[60px] flex flex-col ">
            <paypal-basic-card-button id="paypal-basic-card-button"></paypal-basic-card-button>
        </paypal-basic-card-container>
    );
}
