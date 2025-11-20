import { Container } from "@/components/layout/Container"
import { ProductPanel } from "@/components/panels/ProductPanel"
import { CartSummary } from "@/components/panels/CartSummary"
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder"
import Link from "next/link"
import Redirect from "./Redirect"

export default function ShippingCallbacksPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Redirect</h1>
          <p className="text-muted-foreground">Test Redirect Browser User Experience 因为CORS的问题, 导致很难测, 先测别的去了</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductPanel />
            <CartSummary />
          </div>
          <div>
            <PaymentPlaceholder scenario="Test Redirect" children={<Redirect/>} />
          </div>
        </div>
      </div>
    </Container>
  )
}
