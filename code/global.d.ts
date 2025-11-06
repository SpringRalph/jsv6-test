import * as React from 'react';

type ButtonProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  type?: 'pay' | 'subscribe' | string;
  hidden?: boolean;
  [key: string]: any;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'paypal-button': ButtonProps;
      'venmo-button': ButtonProps;
    }
  }

  interface Window {
    paypal?: {
      createInstance: (opts: any) => Promise<any>;
    };
  }
}

export {};