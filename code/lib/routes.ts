export interface RouteMetadata {
  path: string
  title: string
  description: string
  group: string
  workStage?: number // 0: 未开始, 1: 进行中, 2: 有问题, 3: 需要注意, 4: 完成
}

export const routes: RouteMetadata[] = [
  // Buttons group
  {
    path: "/jsv6-test-cases/buttons/buttons-basic",
    title: "Basic Buttons",
    description: "Test basic PayPal button integration with default settings",
    group: "Buttons",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/buttons-styling",
    title: "Button Styling",
    description: "Test button customization options including color, shape, and words",
    group: "Buttons",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/custom-button",
    title: "Merchant Custom Button",
    description: "Test Merchant host button",
    group: "Buttons",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/pay-later",
    title: "Pay Later",
    description: "Test Pay Later and installment options",
    group: "Buttons",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/bcdc",
    title: "BCDC(PayPal Guest Payment)",
    description: "Test BCDC/Guest Payment Checkout",
    group: "Buttons",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/bcdc-inline",
    title: "BCDC-inline",
    description: "Test inline BCDC",
    group: "Buttons",
    workStage: 2, // 有问题
  },
  {
    path: "/jsv6-test-cases/buttons/venmo",
    title: "Venmo",
    description: "Test Venmo Button",
    group: "Buttons",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/buttons-collection",
    title: "Button collection",
    description: "Show button collection",
    group: "Buttons",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/subscriptions",
    title: "Subscription",
    description: "Show bSubscription",
    group: "Buttons",
    workStage: 1,
  },
  
  // PLM (Pay Later Messaging) group
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging",
    title: "Pay Later Messaging",
    description: "Test PayPal Pay Later Messaging components",
    group: "Messaging",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging-dynamic",
    title: "Dynamic Pay Later Messaging",
    description: "Dynamically render PayPal Pay Later Messaging components",
    group: "Messaging",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging-Analytics",
    title: "Analytize Pay Later Messaging",
    description: "Analytize PayPal Pay Later Messaging Learn More",
    group: "Messaging",
    workStage: 1,
  },
  
  // Browser Display group
  {
    path: "/jsv6-test-cases/browser-display/redirect",
    title: "Redirect",
    description: "Browser Redirect",
    group: "Browser",
    workStage: 2,
  },
  {
    path: "/jsv6-test-cases/browser-display/paymentHandler",
    title: "Payment Handler",
    description: "Use Browser Payment Handler",
    group: "Browser",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/browser-display/sandboxedIframe",
    title: "Sandboxed Iframe",
    description: "Test Browser Sandboxed Iframe behavior",
    group: "Browser",
    workStage: 1,
  },
  {
    path: "/jsv6-test-cases/browser-display/directAppSwitch",
    title: "Direct App Switch",
    description: "Test Browser Direct App Switch behavior",
    group: "Browser",
    workStage: 3,
  },
  {
    path: "/jsv6-test-cases/browser-display/merchantAsyncValidation",
    title: "Merchant Async Validation",
    description: "Test Browser Merchant Async Validation behavior",
    group: "Browser",
    workStage: 4, // 完成
  },
  
  // Advanced group
  {
    path: "/jsv6-test-cases/advanced/googlePay",
    title: "Google Pay",
    description: "Test Google Pay integration for custom checkout",
    group: "Advanced",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/advanced/applePay",
    title: "Apple Pay",
    description: "Test Apple Pay integration for custom checkout",
    group: "Advanced",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/advanced/ACDC",
    title: "ACDC",
    description: "Test Card Fields integration for custom checkout",
    group: "Advanced",
    workStage: 4, // 完成
  },
  
  // APM group
  {
    path: "/jsv6-test-cases/APM/bancontact",
    title: "Bancontact",
    description: "Test APM -- Bancontact",
    group: "APM",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/ideal",
    title: "Ideal",
    description: "Test APM -- Ideal",
    group: "APM",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/blik",
    title: "BliK",
    description: "Test APM -- BliK",
    group: "APM",
    workStage: 4,
  },
 
  {
    path: "/jsv6-test-cases/APM/eps",
    title: "eps",
    description: "Test APM -- eps",
    group: "APM",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/p24",
    title: "Przelewy24",
    description: "Test APM -- Przelewy24",
    group: "APM",
    workStage: 4,
  },
]
