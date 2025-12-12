import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import Venmo from "./Venmo";
import Image from "next/image";

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
                            Venmo
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            Test basic PayPal Venmo integration with default
                            settings
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
                            scenario="Venmo"
                            children={<Venmo />}
                            placeHolder={
                                <div className="flex flex-col text-sm text-left">
                                    <h5>
                                        To ensure smooth collaboration, kindly
                                        follow these guidelines:
                                    </h5>
                                    <ul>
                                        <li>
                                            1.Do not change the email, phone
                                            number, or reset the password.
                                        </li>
                                        <li>
                                            2.Do not enable "Remember this
                                            device" or multi-factor
                                            authentication (MFA).
                                        </li>
                                        <li>3.Do not change the password.</li>
                                    </ul>
                                    Failure to follow these instructions may
                                    impact other partners. Thank you for your
                                    cooperation. Here are the new credentials -
                                    pls test before you share outwards.
                                    <div>pwv-test-user2/VenmoP@y12345</div>
                                    <div>pwv-test-user3/VenmoP@y12345</div>
                                </div>
                            }
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/Venmo.svg"
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
