import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import APPSwitch from "./APPSwitch";
import Image from "next/image";

export default function ShippingCallbacksPage() {
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
                    <h1 className="text-3xl font-bold mb-2">Direct APP Switch</h1>
                    <p className="text-muted-foreground">
                        Test Verified on 2026-06-09
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Mobile PayPal APP Switch"
                            children={<APPSwitch />}
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/paypal.svg"
                                    alt="PayPal"
                                    width={100}
                                    height={100}
                                />
                            }
                            placeHolder={
                                <span>
                                    Tries{" "}
                                    <code>direct-app-switch</code> →{" "}
                                    <code>popup</code> → <code>modal</code>;
                                    on return the SDK auto-calls{" "}
                                    <code>resume()</code>.
                                </span>
                            }
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
