"use client";

import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import { FixedProductPanel } from "@/components/panels/FixedProductPanel";
import { FixedCartSummary } from "@/components/panels/FixedCartSummary";
import Image from "next/image";
import PayLaterMessageAnalytics from "./PayLaterMessageAnalytics";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

export default function PayLaterPage() {
    const { setQuantity } = useCartStore();

    const [show, showFlag] = useState(false);

    useEffect(() => {
        setQuantity(5);
        showFlag(true);
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
                        Pay Later Message Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Test Pay Later Message Analytics Feature. Use dynamic
                        pay later messageing render solution. <br />
                        Suitable for a fix amount at Checkout Page where total
                        number cannot be modified.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <FixedProductPanel />
                        <FixedCartSummary />
                    </div>
                    {show && (
                        <div>
                            <PaymentPlaceholder
                                scenario="Pay Later Message Analytics"
                                children={<PayLaterMessageAnalytics />}
                                placeHolder={
                                    <p className="text-sm">
                                        <span className="text-sm text-left font-bold text-red-600">
                                            Please Click 'learn more' to see the analytics log.
                                        </span>
                                        有bug, Click 'learn more' 后直接报错了. Doc的代码还是错的, 也没有示例example
                                    </p>
                                }
                                paymentAreaIcon={
                                    <Image
                                        src="/payment-area-icon/paylater-word.svg"
                                        alt="PayPal"
                                        width={100}
                                        height={100}
                                    />
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}
