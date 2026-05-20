"use client";

import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Image from "next/image";
import PayLaterMessageLive from "./PayLaterMessageLive";
import { useEnvStore } from "@/store/useEnvStore";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import { useEffect, useRef } from "react";
import type { PayPalEnv } from "@/types/env";

export default function MessagingLivePage() {
    const { env, setEnv, bumpSdkReloadToken } = useEnvStore();
    const originalEnvRef = useRef<PayPalEnv>(env);

    useEffect(() => {
        const originalEnv = originalEnvRef.current;

        if (originalEnv !== "live") {
            unloadPayPalWebSdk();
            setEnv("live");
            bumpSdkReloadToken();
        }

        return () => {
            if (originalEnv !== "live") {
                unloadPayPalWebSdk();
                setEnv(originalEnv);
                bumpSdkReloadToken();
            }
        };
    }, []);

    return (
        <Container>
            <div className="space-y-6">
                <div>
                    <Link
                        href="/"
                        className="text-primary hover:underline mb-4 inline-block"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">
                        Pay Later Messaging (Live)
                    </h1>
                    <p className="text-muted-foreground">
                        Test PayPal Pay Later Messaging in Live environment. Environment switches to Live on entry and restores on exit.
                    </p>
                    <p className="mt-1 text-xs text-amber-600 font-medium">
                        ⚠️ Live environment — real transactions may occur
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Messaging (Live)"
                            children={<PayLaterMessageLive />}
                            placeHolder={
                                <p className="text-sm">
                                    此页面在Live环境下测试 PayPal Pay Later Messaging。
                                    <br />
                                    进入此页面时自动切换为 Live 环境，离开时恢复原环境。
                                </p>
                            }
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/Messaging.svg"
                                    alt="PayPal"
                                    width={100}
                                    height={100}
                                />
                            }
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
