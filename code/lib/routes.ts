export interface RouteMetadata {
  path: string
  title: string
  description: string
  group: string
  panelIcon: string // lucide图标名称，用于在页面上显示不同的图标
  workStage?: number // 0: 未开始, 1: 进行中, 2: 有问题, 3: 需要注意, 4: 完成
}



export const routes: RouteMetadata[] = [
  // Buttons group
  {
    path: "/jsv6-test-cases/buttons/buttons-basic",
    title: "Basic Buttons",
    description: "Test basic PayPal button integration with default settings",
    group: "Buttons",
    panelIcon: "Button",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/buttons-styling",
    title: "Button Styling",
    description: "Test button customization options including color, shape, and words",
    group: "Buttons",
    panelIcon: "Palette",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/custom-button",
    title: "Merchant Custom Button",
    description: "Test Merchant host button",
    group: "Buttons",
    panelIcon: "Code",
    workStage: 4,
  },
 
  {
    path: "/jsv6-test-cases/buttons/bcdc",
    title: "BCDC(PayPal Guest Payment)",
    description: "Test BCDC/Guest Payment Checkout",
    group: "Buttons",
    panelIcon: "User",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/bcdc-inline",
    title: "BCDC-inline",
    description: "Test inline BCDC",
    group: "Buttons",
    panelIcon: "Layers",
    workStage: 2, // 有问题
  },
  {
    path: "/jsv6-test-cases/buttons/venmo",
    title: "Venmo",
    description: "Test Venmo Button",
    group: "Buttons",
    panelIcon: "DollarSign",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/buttons-collection",
    title: "Button collection",
    description: "Show button collection",
    group: "Buttons",
    panelIcon: "LayoutGrid",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/subscriptions",
    title: "Subscription",
    description: "Show bSubscription",
    group: "Buttons",
    panelIcon: "RefreshCcw",
    workStage: 1,
  },
  
  // PLM (Pay Later Messaging) group
   {
    path: "/jsv6-test-cases/PLM/pay-later",
    title: "Pay Later",
    description: "Test Pay Later and installment options",
    group: "PayLater",
    panelIcon: "Clock",
    workStage: 4, 
  },

  {
    path: "/jsv6-test-cases/PLM/pay-later-custom-button",
    title: "Pay Later with Custom Button",
    description: "Test Integrate Pay Later with Custom Button",
    group: "PayLater",
    panelIcon: "Clock",
    workStage: 4, 
  },

  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging",
    title: "Pay Later Messaging",
    description: "Test PayPal Pay Later Messaging components",
    group: "PayLater",
    panelIcon: "MessageSquare",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging-dynamic",
    title: "Dynamic Pay Later Messaging",
    description: "Dynamically render PayPal Pay Later Messaging components",
    group: "PayLater",
    panelIcon: "Zap",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging-Analytics",
    title: "Analytize Pay Later Messaging",
    description: "Analytize PayPal Pay Later Messaging Learn More",
    group: "PayLater",
    panelIcon: "BarChart2",
    workStage: 1,
  },
  
  // Browser Display group
  {
    path: "/jsv6-test-cases/browser-display/redirect",
    title: "Redirect",
    description: "Browser Redirect",
    group: "Browser",
    panelIcon: "RefreshCcw",
    workStage: 2,
  },
  {
    path: "/jsv6-test-cases/browser-display/paymentHandler",
    title: "Payment Handler",
    description: "Use Browser Payment Handler",
    group: "Browser",
    panelIcon: "Wallet",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/browser-display/sandboxedIframe",
    title: "Sandboxed Iframe",
    description: "Test Browser Sandboxed Iframe behavior",
    group: "Browser",
    panelIcon: "Shield",
    workStage: 1,
  },
  {
    path: "/jsv6-test-cases/browser-display/directAppSwitch",
    title: "Direct App Switch",
    description: "Test Browser Direct App Switch behavior",
    group: "Browser",
    panelIcon: "Smartphone",
    workStage: 3,
  },
  {
    path: "/jsv6-test-cases/browser-display/merchantAsyncValidation",
    title: "Merchant Async Validation",
    description: "Test Browser Merchant Async Validation behavior",
    group: "Browser",
    panelIcon: "CheckCircle2",
    workStage: 4, // 完成
  },
  
  // Advanced group
  {
    path: "/jsv6-test-cases/advanced/googlePay",
    title: "Google Pay",
    description: "Test Google Pay integration for custom checkout",
    group: "Advanced",
    panelIcon: "Google",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/advanced/applePay",
    title: "Apple Pay",
    description: "Test Apple Pay integration for custom checkout",
    group: "Advanced",
    panelIcon: "Apple",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/advanced/ACDC",
    title: "ACDC",
    description: "Test Card Fields integration for custom checkout",
    group: "Advanced",
    panelIcon: "CreditCard",
    workStage: 4, // 完成
  },

  {
    path: "/jsv6-test-cases/advanced/fastlane",
    title: "Fastlane",
    description: "Test Fastlane integration for custom checkout",
    group: "Advanced",
    panelIcon: "ArrowRight",
    workStage: 1,
  },
  
  // APM group
  {
    path: "/jsv6-test-cases/APM/bancontact",
    title: "Bancontact",
    description: "Test APM -- Bancontact",
    group: "APM",
    panelIcon: "EuroSign",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/ideal",
    title: "Ideal",
    description: "Test APM -- Ideal",
    group: "APM",
    panelIcon: "Banknote",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/blik",
    title: "BliK",
    description: "Test APM -- BliK",
    group: "APM",
    panelIcon: "Mobile",
    workStage: 4,
  },
 
  {
    path: "/jsv6-test-cases/APM/eps",
    title: "eps",
    description: "Test APM -- eps",
    group: "APM",
    panelIcon: "Building",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/APM/p24",
    title: "Przelewy24",
    description: "Test APM -- Przelewy24",
    group: "APM",
    panelIcon: "CircleDollarSign",
    workStage: 4,
  },
]
