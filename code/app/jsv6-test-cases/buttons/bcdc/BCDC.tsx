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
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
import { OneTimePaymentSession } from "@paypal/paypal-js/sdk-v6";
import React, { useEffect } from "react";
import consola from "consola";

interface BCDCProps {
    bcdcEndPoint?:string
}


export default function BCDC(props: BCDCProps) {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

    // Setup standard PayPal button
    async function setupBCDCButton(sdkInstance: AppSdkInstance) {
        const paypalGuestPaymentSession =
            //@ts-ignore
            sdkInstance.createPayPalGuestOneTimePaymentSession(
                paymentSessionOptions
            );

        const bcdcButton = document.querySelector("#paypal-basic-card-button")!;

        // get the promise reference by invoking createOrder()
        // do not await this async function since it can cause transient activation issues

        const createOrderPromise = props.bcdcEndPoint? createOrderOverallPayPal(props.bcdcEndPoint) : createOrderBCDC();

        bcdcButton.addEventListener("click", async () => {
            try {
                await paypalGuestPaymentSession.start(
                    { targetElement: bcdcButton, presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrderPromise
                );
            } catch (error) {
                consola.error("PayPal payment start error:", error);
                handlePaymentError(error);
            }
        });
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
                    initOptions
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    //这里是BCDC和普通的最大不同
                    components: ["paypal-guest-payments"],
                    pageType: "checkout",  
                });

                //因为进行eligibilty check有的时候会出现bug, 所以通过flag来控制是否进行eligibilty check
                // if (!true) {
                if (true) {
                    // ####################### 进行eligibility check ###############################

                    // Check eligibility for all payment methods
                    const paymentMethods =
                        await safeFindEligibleMethods(sdkInstance, {
                            currencyCode: "USD",
                        });
                    if (!paymentMethods) return;

                    // debugger;

                    // [ATTENTION!]这里有问题, 这里不需要 find-eligible-methods, 里面也似乎没有值
                    // Setup BCDC button if eligible
                    // if (paymentMethods.isEligible("paypal")) {
                    //     setupBCDCButton(sdkInstance);
                    // }

                    setupBCDCButton(sdkInstance);

                    // ############################################################################
                } else {
                    // ####################### 不进行eligibility check, 直接渲染按钮 ###############################
                    setupBCDCButton(sdkInstance);
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
        <paypal-basic-card-container>
            <paypal-basic-card-button id="paypal-basic-card-button"></paypal-basic-card-button>
        </paypal-basic-card-container>
    );
}