import { Container } from "@/components/layout/Container"
import { ProductPanel } from "@/components/panels/ProductPanel"
import { CartSummary } from "@/components/panels/CartSummary"
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder"
import Link from "next/link"
import CardFields from "./CardFields"
import { CreditCard } from "lucide-react"

export default function ButtonsBasicPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl -z-10" />

          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4 group">
            <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅️</span>
            Back to Home
          </Link>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <CreditCard className="size-8 text-blue-500" />
              ACDC
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="text-lg">📝</span>
              ACDC的confirm-payment-source方法时不时会报错, 这有问题, 需要多试几次才能成功支付
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductPanel />
            <CartSummary />
          </div>
          <div>
            <PaymentPlaceholder scenario="ACDC" children={<CardFields/>} />
          </div>
        </div>
      </div>
    </Container>
  )
}
