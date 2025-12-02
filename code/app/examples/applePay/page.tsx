import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import ApplePay from "./ApplePayButton";
import Image from 'next/image';

export default function ButtonsBasicPage() {
    return (
        <Container>
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl -z-10" />

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary hover:underline mb-4 group"
                    >
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">
                            ⬅️
                        </span>
                        Back to Home
                    </Link>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <span className="text-4xl">🔘</span>
                            Apple Pay Button
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            Test Apple Pay button integration with basic settings
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Apple Pay"
                            children={<ApplePay />}
                            placeHolder={
                                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mt-0.5">⚠️</span>
                                        <div>
                                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Apple Pay 注意事项</h3>
                                            <ul className="mt-2 space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-yellow-500 mt-1">•</span>
                                                    <span>Apple Pay 需要 HTTPS 环境才能正常渲染</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-yellow-500 mt-1">•</span>
                                                    <span>非 Apple 设备上，仅允许加载来自 <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js</code> 的脚本</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-yellow-500 mt-1">•</span>
                                                    <span>需要Apple Development Suite才能完成测试付款</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            }
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/apple-fill.svg"
                                    alt="Apple Pay"
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
