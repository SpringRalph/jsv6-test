export interface RouteMetadata {
  path: string
  title: string
  description: string
  group: string
  workStage?: number // 0: 未开始, 1: 进行中, 2: 有问题, 3: 技术限制, 4: 完成
}

export const routes: RouteMetadata[] = [
  {
    path: "/examples/buttons-basic",
    title: "Basic Buttons",
    description: "Test basic PayPal button integration with default settings",
    group: "Buttons",
    workStage: 4, // 完成
  },

  {
    path: "/examples/buttons-styling",
    title: "Button Styling",
    description: "Test button customization options including color, shape, and words",
    group: "Buttons",
    workStage: 4, // 完成
  },

  {
    path: "/examples/pay-later",
    title: "Pay Later",
    description: "Test Pay Later and installment options",
    group: "Buttons",
    workStage: 4, // 完成
  },

  {
    path: "/examples/venmo",
    title: "Venmo",
    description: "Test Venmo Button",
    group: "Buttons",
    workStage: 0, // 未开始
  },


  {
    path: "/examples/messaging",
    title: "Pay Later Messaging",
    description: "Test PayPal Pay Later Messaging components",
    group: "Messaging",
    workStage: 0, // 未开始
  },

  {
    path: "/examples/googlePay",
    title: "Google Pay",
    description: "Test Google Pay integration for custom checkout",
    group: "Advanced",
    workStage: 0, // 未开始
  },

  {
    path: "/examples/applePay",
    title: "Apple Pay",
    description: "Test Apple Pay integration for custom checkout",
    group: "Advanced",
    workStage: 0, // 未开始
  },

  {
    path: "/examples/fastlane",
    title: "FastLane",
    description: "Test Fast Lane integration for custom checkout",
    group: "Advanced",
    workStage: 0, // 未开始
  },
  {
    path: "/examples/vaulting",
    title: "Vaulting",
    description: "Test payment method vaulting for future transactions",
    group: "Vault",
    workStage: 0, // 未开始
  },
  {
    path: "/examples/redirect",
    title: "Redirect",
    description: "Browser Redirect",
    group: "Browser",
    workStage: 3, // 技术限制
  },
  {
    path: "/examples/paymentHandler",
    title: "Payment Handler",
    description: "Use Browser Payment Handler",
    group: "Browser",
    workStage: 4, // 完成
  },
  {
    path: "/examples/sandboxedIframe",
    title: "Sandboxed Iframe",
    description: "Test Browser Sandboxed Iframe behavior",
    group: "Browser",
    workStage: 3, // 技术限制
  },

  {
    path: "/examples/directAppSwitch",
    title: "Direct App Switch",
    description: "Test Browser Direct App Switch behavior",
    group: "Browser",
    workStage: 0, // 未开始
  },



  {
    path: "/examples/merchantAsyncValidation",
    title: "Merchant Async Validation",
    description: "Test Browser Merchant Async Validation behavior",
    group: "Browser",
    workStage: 4, // 完成
  },

   {
    path: "/examples/bancontact",
    title: "Bancontact",
    description: "Test APM -- Bancontact",
    group: "APM",
    workStage: 0, // 未开始
  },

  {
    path: "/examples/ideal",
    title: "Ideal",
    description: "Test APM -- Ideal",
    group: "APM",
    workStage: 0, // 未开始
  },

]
