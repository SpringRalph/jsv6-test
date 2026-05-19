import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import ButtonSubscription from "./ButtonSubscription";
import Image from "next/image";

export default function SubscriptionsPage() {
    return (
        <Container>
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-2xl blur-2xl -z-10" />

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary hover:underline mb-4 group"
                    >
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">
                            ⬅️
                        </span>
                        Back to Home
                    </Link>

                    <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 p-6 rounded-2xl border-2 border-green-200 dark:border-green-800">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <span className="text-4xl">🔄</span>
                            Subscriptions
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            Test subscription and recurring payment setup
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
                            scenario="Subscriptions"
                            children={<ButtonSubscription />}
                            placeHolder=""
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/paypal.svg"
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
