import { Container } from "@/components/layout/Container"
import { ProductPanel } from "@/components/panels/ProductPanel"
import { CartSummary } from "@/components/panels/CartSummary"
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder"
import Link from "next/link"
import PayLater from "./PayLater"

export default function PayLaterPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Pay Later</h1>
          <p className="text-muted-foreground">Test Pay Later Button</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductPanel />
            <CartSummary />
          </div>
          <div>
            <PaymentPlaceholder scenario="PayLater" children=< PayLater /> />
          </div>
        </div>
      </div>
    </Container>
  )
}
