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

/* 兼容新的 JSX runtime：同时扩展 react 模块下的 JSX 命名空间 */  
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'paypal-button': ButtonProps;
      'venmo-button': ButtonProps;
    }
  }
}

export {};