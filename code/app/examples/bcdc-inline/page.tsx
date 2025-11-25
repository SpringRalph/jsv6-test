import { Container } from "@/components/layout/Container"
import { ProductPanel } from "@/components/panels/ProductPanel"
import { CartSummary } from "@/components/panels/CartSummary"
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder"
import Link from "next/link"
import BCDCInline from "./BCDCInline"

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
              <span className="text-4xl">🔘</span>
              BCDC-Inline
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="text-lg">📝</span>
              Test BCDC-Inline, 目前根据文档, 只发现了可以弹窗的形式, 按理说可以以inline的形式渲染. 不知道和clientId等因素是不是相关. 目前通过传入测试参数testBuyerCountry: "US"来实现. 而且预填信息会丢失
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProductPanel />
            <CartSummary />
          </div>
          <div>
            <PaymentPlaceholder scenario="BCDC-Inline" children={<BCDCInline/>} />
          </div>
        </div>
      </div>
    </Container>
  )
}
