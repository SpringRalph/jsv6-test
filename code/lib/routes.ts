export interface RouteMetadata {
  path: string
  title: string
  description: string
  group: string
}

export const routes: RouteMetadata[] = [
  {
    path: "/examples/buttons-basic",
    title: "Basic Buttons",
    description: "Test basic PayPal button integration with default settings",
    group: "Buttons",
  },
  {
    path: "/examples/buttons-styling",
    title: "Button Styling",
    description: "Test button customization options including color, shape, and size",
    group: "Buttons",
  },
  {
    path: "/examples/funding-sources",
    title: "Funding Sources",
    description: "Test different funding sources and payment methods",
    group: "Buttons",
  },
  {
    path: "/examples/pay-later",
    title: "Pay Later",
    description: "Test Pay Later messaging and installment options",
    group: "Messaging",
  },
  {
    path: "/examples/messaging",
    title: "Messaging",
    description: "Test PayPal messaging components for promotional content",
    group: "Messaging",
  },
  {
    path: "/examples/card-fields",
    title: "Card Fields",
    description: "Test advanced card fields integration for custom checkout",
    group: "Advanced",
  },
  {
    path: "/examples/hosted-fields",
    title: "Hosted Fields",
    description: "Test hosted fields for secure card data collection",
    group: "Advanced",
  },
  {
    path: "/examples/shipping-callbacks",
    title: "Shipping Callbacks",
    description: "Test shipping address and option callbacks",
    group: "Advanced",
  },
  {
    path: "/examples/vaulting",
    title: "Vaulting",
    description: "Test payment method vaulting for future transactions",
    group: "Advanced",
  },
  {
    path: "/examples/subscriptions",
    title: "Subscriptions",
    description: "Test subscription and recurring payment setup",
    group: "Advanced",
  },
  {
    path: "/examples/orders",
    title: "Orders API",
    description: "Test Orders API integration for advanced checkout flows",
    group: "Advanced",
  },
]
