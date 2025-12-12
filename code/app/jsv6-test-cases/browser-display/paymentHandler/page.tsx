import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import PaymentHandlerBtn from "./paymentHandlerBtn";
import Image from 'next/image';

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
                    <h1 className="text-3xl font-bold mb-2">Payment Handler</h1>
                    <p className="text-muted-foreground">
                        Test Payment Handler Browser User Experience
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="Test Payment Handler"
                            children={<PaymentHandlerBtn />}
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/paypal.svg"
                                    alt="PayPal"
                                    width={100}
                                    height={100}
                                />
                            }
                            placeHolder={
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-bold text-lg text-blue-800 mb-2">What is Payment Handler?</h3>
                                    <p className="text-gray-700 mb-3">
                                        Payment Handler API allows websites to handle payment requests directly in the browser,
                                        providing a seamless payment experience.
                                    </p>
                                    <a 
                                        href="https://developer.mozilla.org/en-US/docs/Web/API/Payment_Handler_API" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                                    >
                                        Learn more on MDN Web Docs
                                    </a>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
