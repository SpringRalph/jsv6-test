import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Image from "next/image";
import PayLaterMessageAnalytics from "./PayLaterMessageAnalytics";

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
                    <h1 className="text-3xl font-bold mb-2">
                        PayLater Message Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Pay Later messaging Learn More
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Dynamically Messaging"
                            children={<PayLaterMessageAnalytics />}
                            placeHolder={
                                <p className="text-sm">
                                    Study "Learn More" behavior
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
