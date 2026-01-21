import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Image from "next/image";
import PayLaterMessageBasic from "./PayLaterMessageBasic";

export default function MessagingPage() {
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
                    <h1 className="text-3xl font-bold mb-2">Messaging</h1>
                    <p className="text-muted-foreground">
                        Test PayPal messaging components for promotional content
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Messaging"
                            children={<PayLaterMessageBasic />}
                            placeHolder={
                                <p className="text-sm">
                                    cross-border-messaging需要在加载button时,
                                    添加一个参数 <br />
                                    <span className="text-sm text-left font-bold text-red-600">
                                        sdkInstance.createPayPalMessages(&#123;'buyerCountry':
                                        "US"&#125;)
                                    </span>
                                    <br />
                                    这里的buyerCountry就相当于之前的data-pp-buyerCountry属性`
                                    <span className="mt-3 inline-flex flex-wrap items-center gap-1 rounded border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                        可访问
                                        <a
                                            href="https://ppgms-test.github.io/PayLater/JSV6-PLM/jsv6-cross-border-msg.html"
                                            className="underline"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            该示例页面
                                        </a>
                                        查看实际效果
                                    </span>
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
