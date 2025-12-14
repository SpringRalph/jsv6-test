import { Container } from "@/components/layout/Container"
import { ProductPanel } from "@/components/panels/ProductPanel"
import { CartSummary } from "@/components/panels/CartSummary"
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder"
import Link from "next/link"
import Image from "next/image"
import IframeButtonTest from "./iframeButton"

export default function ShippingCallbacksPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <Link href="https://jsv6-test.pages.dev" className="text-primary hover:underline mb-4 inline-block ">
            ← Back to <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm">jsv6-test.pages.dev</code>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Sandboxed Iframe</h1>
          <p className="text-muted-foreground">Test A checkout page embedded entirely in another iframe (Such as embedded in the merchant site page). <br />目前发现只有auto模式起效, redirect模式因为CORS会报错, 而payment handler模式会锁住整个网页(父页面和iframe)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductPanel />
            <CartSummary />
          </div>
          <div>
            <PaymentPlaceholder scenario="Sandboxed Iframe" children={<IframeButtonTest />}
              paymentAreaIcon={
                <Image
                  src="/payment-area-icon/paypal.svg"
                  alt="PayPal"
                  width={100}
                  height={100}
                />
              }

              placeHolder={<span>Host Page could communicate with Iframe Page</span>} />
          </div>
        </div>
      </div>
    </Container>
  )
}
