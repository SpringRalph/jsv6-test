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
      'paypal-message': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'auto-bootstrap'?: boolean;
        'amount'?: string;
        'currency-code'?: string;
        'text-color'?: 'BLACK' | 'MONOCHROME' | 'WHITE';
        'logo-position'?: 'INLINE' | 'LEFT' | 'RIGHT' | 'TOP';
        'logo-type'?: 'MONOGRAM ' | 'TEXT ' | 'WORDMARK';
        'presentation-mode'?: 'AUTO' | 'MODAL' | 'POPUP' | 'REDIRECT';
        [key: string]: any;
      }
      'sdk-custom-button-wrapper': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'funding-source'?: string;
        [key: string]: any;
      }
      'bancontact-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
      'blik-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
      'ideal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
      'eps-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
      'p24-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [key: string]: any;
      }
    }
  }
}

export { };