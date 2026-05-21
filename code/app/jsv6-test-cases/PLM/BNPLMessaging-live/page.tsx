"use client";

import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Image from "next/image";
import PayLaterMessageLive from "./PayLaterMessageLive";
import { useEnvStore } from "@/store/useEnvStore";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

export default function MessagingLivePage() {
    const env = useEnvStore((state) => state.env);
    const router = useRouter();

    const isLive = env === "live";

    return (
        <>
            {/* Guard dialog — shown when not in live env */}
            <AlertDialog.Root open={!isLive}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-800 dark:bg-zinc-900">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-xl">
                                🚫
                            </span>
                            <AlertDialog.Title className="text-lg font-semibold text-red-800 dark:text-red-300">
                                需要 Live 环境
                            </AlertDialog.Title>
                        </div>
                        <AlertDialog.Description className="mb-6 text-sm text-muted-foreground leading-relaxed">
                            此测试用例仅在 <span className="font-semibold text-red-700 dark:text-red-400">Live 环境</span> 下可用。
                            请先在 Environment Configuration 中切换到 Live 环境，再访问此页面。
                        </AlertDialog.Description>
                        <div className="flex justify-end">
                            <AlertDialog.Action asChild>
                                <button
                                    onClick={() => router.push("/")}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    返回主页
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>

            {/* Page content — only meaningful when live */}
            {isLive && (
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
                                Test PayPal Pay Later Messaging in Live environment.
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
                                            此页面在 Live 环境下测试 PayPal Pay Later Messaging。
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
            )}
        </>
    );
}
