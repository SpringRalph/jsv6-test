import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Redirect from "./Redirect";
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
                    <h1 className="text-3xl font-bold mb-2">Redirect</h1>
                    <p className="text-muted-foreground">
                        Need a domain to Test this, PayPal cannot fetch a
                        localhost URL
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Test Redirect"
                            children={<Redirect />}
                            paymentAreaIcon ={
                                <Image
                                    src="/payment-area-icon/paypal.svg"
                                    alt="PayPal"
                                    width={100}
                                    height={100}
                                />
                            }

                            placeHolder={<span>似乎有bug,也可能是react需要搞点花活</span>}
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
