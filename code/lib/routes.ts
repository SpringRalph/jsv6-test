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
    panelIcon: "MousePointerClick",
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
    panelIcon: "UserCheck",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/bcdc-inline",
    title: "BCDC-inline",
    description: "Test inline BCDC",
    group: "Buttons",
    panelIcon: "Layers",
    workStage: 4, // 完成
  },
 {
    path: "/jsv6-test-cases/buttons/bcdc-inline-autostart",
    title: "BCDC-inline-Auto",
    description: "Test inline BCDC Auto expansion",
    group: "Buttons",
    panelIcon: "Layers",
    workStage: 4, // 完成
  },
  {
    path: "/jsv6-test-cases/buttons/venmo",
    title: "Venmo",
    description: "Test Venmo Button",
    group: "Buttons",
    panelIcon: "Send",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/buttons/buttons-collection-withoutpaylater",
    title: "Wallet and BCDC",
    description: "Button collection(without PayLater)",
    group: "Buttons",
    panelIcon: "Wallet",
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
    description: "Show Subscription",
    group: "Buttons",
    panelIcon: "CalendarClock",
    workStage: 4,
  },

  // PLM (Pay Later Messaging) group
  {
    path: "/jsv6-test-cases/PLM/pay-later",
    title: "Pay Later",
    description: "Test Pay Later and installment options",
    group: "PayLater",
    panelIcon: "Landmark",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/PLM/pay-later-custom-button",
    title: "Pay Later with Custom Button",
    description: "Test Integrate Pay Later with Custom Button",
    group: "PayLater",
    panelIcon: "PenLine",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/PLM/pay-later-witheligiblecheck",
    title: "Pay Later with Eligible Check",
    description: "Test Pay Later with eligibility validation before render",
    group: "PayLater",
    panelIcon: "BadgeCheck",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/PLM/pay-later-witheligiblecheck-backend",
    title: "Pay Later with Eligible Check from server side",
    description: "Test Pay Later with eligibility validation from server side before render",
    group: "PayLater",
    panelIcon: "ServerCog",
    workStage: 2,
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
    path: "/jsv6-test-cases/PLM/BNPLMessaging-live",
    title: "Pay Later Messaging (Live)",
    description: "Test PayPal Pay Later Messaging in Live environment — auto-switches to Live on entry and restores original env on exit",
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
    workStage: 3,
  },
  {
    path: "/jsv6-test-cases/PLM/BNPLMessaging-Analytics",
    title: "Analyze Pay Later Messaging",
    description: "Analyze PayPal Pay Later Messaging Learn More",
    group: "PayLater",
    panelIcon: "BarChart2",
    workStage: 2,
  },

  // Browser Display group
  {
    path: "/jsv6-test-cases/browser-display/redirect",
    title: "Redirect",
    description: "Browser Redirect",
    group: "Browser",
    panelIcon: "CornerUpRight",
    workStage: 2,
  },
  {
    path: "/jsv6-test-cases/browser-display/paymentHandler",
    title: "Payment Handler",
    description: "Use Browser Payment Handler",
    group: "Browser",
    panelIcon: "HandCoins",
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


  {
    path: "/jsv6-test-cases/browser-display/redirect-outgoing",
    title: "Simple Redirect Case",
    description: "Browser Redirect",
    group: "Browser",
    panelIcon: "ExternalLink",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/browser-display/directAppSwitch-outgoing",
    title: "Simple Direct App Switch",
    description: "Test Browser Direct App Switch behavior",
    group: "Browser",
    panelIcon: "TabletSmartphone",
    workStage: 4,
  },

  // Advanced group
  {
    path: "/jsv6-test-cases/advanced/googlePay",
    title: "Google Pay",
    description: "Test Google Pay integration for custom checkout",
    group: "Advanced",
    panelIcon: "GooglePay",
    workStage: 4,
  },
  {
    path: "/jsv6-test-cases/advanced/applePay",
    title: "Apple Pay",
    description: "Test Apple Pay integration for custom checkout",
    group: "Advanced",
    panelIcon: "ApplePay",
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
    panelIcon: "FastForward",
    workStage: 1,
  },

  {
    path: "/jsv6-test-cases/advanced/vault-save-payment",
    title: "SavePayment",
    description: "Save Payment Without Purchase",
    group: "Advanced",
    panelIcon: "BookmarkCheck",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/advanced/vault-save-with-purchase",
    title: "VaultWithPurchase",
    description: "Save Payment With Purchase",
    group: "Advanced",
    panelIcon: "ShoppingCart",
    workStage: 4,
  },

  {
    path: "/jsv6-test-cases/advanced/vault-recurring",
    title: "Vault Recurring",
    description: "Recurring Vault Payment",
    group: "Advanced",
    panelIcon: "Repeat2",
    workStage: 4,
  },

  // APM group
  {
    path: "/jsv6-test-cases/APM/bancontact",
    title: "Bancontact",
    description: "Test APM -- Bancontact",
    group: "APM",
    panelIcon: "Euro",
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
    panelIcon: "Smartphone",
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
