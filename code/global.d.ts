import * as React from 'react';

type ButtonProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  type?: 'pay' | 'subscribe' | string;
  hidden?: boolean;
  [key: string]: any;
};

type PayLaterButtonProps = ButtonProps & {
  productCode?: string;
  countryCode?: string;
};

type InstanceInput = {
  clientToken: string;
  locale?: string;
  pageType?: string;
  components?: string[];
}

type InstanceOutput = {
  createPayPalCheckout: () => {};
  createVenmoCheckout: () => {};
  findEligibleMethods: (options: EligibilityInput) => Promise<EligibilityOutput>;
}

declare global {
  interface Window {
    paypal?: {
      createInstance: (opts: InstanceInput) => Promise<any>;
    };
  }
}

/* 兼容新的 JSX runtime：同时扩展 react 模块下的 JSX 命名空间 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'paypal-button': ButtonProps;
      'venmo-button': ButtonProps;
      'paypal-pay-later-button': PayLaterButtonProps;
      'paypal-credit-button': ButtonProps;
      'paypal-basic-card-button': ButtonProps;
      'paypal-basic-card-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
    }
  }
}

export { };