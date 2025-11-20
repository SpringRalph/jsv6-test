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
    description: "Test button customization options including color, shape, and words",
    group: "Buttons",
  },

  {
    path: "/examples/pay-later",
    title: "Pay Later",
    description: "Test Pay Later and installment options",
    group: "Buttons",
  },

  {
    path: "/examples/venmo",
    title: "Venmo",
    description: "Test Venmo Button",
    group: "Buttons",
  },


  {
    path: "/examples/messaging",
    title: "Pay Later Messaging",
    description: "Test PayPal Pay Later Messaging components",
    group: "Messaging",
  },

  {
    path: "/examples/googlePay",
    title: "Google Pay",
    description: "Test Google Pay integration for custom checkout",
    group: "Advanced",
  },

  {
    path: "/examples/applePay",
    title: "Apple Pay",
    description: "Test Apple Pay integration for custom checkout",
    group: "Advanced",
  },

  {
    path: "/examples/fastlane",
    title: "FastLane",
    description: "Test Fast Lane integration for custom checkout",
    group: "Advanced",
  },
  {
    path: "/examples/vaulting",
    title: "Vaulting",
    description: "Test payment method vaulting for future transactions",
    group: "Vault",
  },
  {
    path: "/examples/redirect",
    title: "Redirect",
    description: "Browser Redirect",
    group: "Browser",
  },
  {
    path: "/examples/paymentHandler",
    title: "Payment Handler",
    description: "Use Browser Payment Handler",
    group: "Browser",
  },
  {
    path: "/examples/sandboxedIframe",
    title: "Sandboxed Iframe",
    description: "Test Browser Sandboxed Iframe behavior",
    group: "Browser",
  },

  {
    path: "/examples/directAppSwitch",
    title: "Direct App Switch",
    description: "Test Browser Direct App Switch behavior",
    group: "Browser",
  },



  {
    path: "/examples/merchantAsyncValidation",
    title: "Merchant Async Validation",
    description: "Test Browser Merchant Async Validation behavior",
    group: "Browser",
  },

   {
    path: "/examples/bancontact",
    title: "Bancontact",
    description: "Test APM -- Bancontact",
    group: "APM",
  },

  {
    path: "/examples/ideal",
    title: "Ideal",
    description: "Test APM -- Ideal",
    group: "APM",
  },

]
