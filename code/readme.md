JS SDK v6 的使用心得:

1. 引入了类似工厂模式的 paypal 对象创建方式, 这使得单例模式的维护变得很简单. 本工程就是使用了单例模式
2. `getBrowserSafeClientToken`的代码实现文档写的很垃圾, 很容易注意不到. 实例代码中又是使用了`server sdk`来完成的. 不知道具体的`rest api`实现
    ```js
    const form = new URLSearchParams();
    form.append("grant_type", "client_credentials");
    form.append("response_type", "client_token");
    ```
3. 现在使用自定义的`DOM`元素对象: `paypal-button`. 这让基于 react 的项目变得很难受.
   需要在`.d.ts`文件中拓展 react 的命名空间:

    ```ts
    declare module "react" {
        namespace JSX {
            interface IntrinsicElements {
                "paypal-button": ButtonProps;
                "venmo-button": ButtonProps;
            }
        }
    }
    ```

    这个部门文档中也没写

4. checkEligibilty 的这个函数的请求很容易报错

5. 无论是内部文档还是 online doc 都没有提到 `createInstance()` 这个方法中可以传入 `testBuyerCountry`这个参数, 需要查看`typescript`的`d.ts`函数接口才可以

6. 没有办法渲染 `BCDC`

7. `<pay-later>`JSX 元素不给`id`的话 DOM 渲染容易出问题 (存疑) | online-doc 上使用的无`id`的 example, code-sample 中加了`id`
8. online doc 完全没有说`css`样式的问题

9. 在`payment handler`中的浏览器实现, ts 类型错误
   ```ts
   export type BasePaymentSession = {
        start: (
        options: PresentationModeOptionsForAuto,
        PaymentSessionPromise?: BasePaymentSessionPromise,
        ) => Promise<void>;
        destroy: () => void;
        cancel: () => void;
   };
    ```
    这里的`options`竟然支持持`"auto"`, 事实上传入`"payment-handler"`也是正确的.  
    此外在`"payment-handler"`模式下, onApprove的回调函数的数据格式竟然和别的不一样, 也不符合自己给出的`type`定义
    ```ts
    type OnApproveDataOneTimePayments = {
        orderId: string;
        payerId?: string | undefined;
        billingToken?: string | undefined;
    }
    ```
    在这个数据结构外, 竟然又包了一层`data`, 需要`data.data.orderId`才能获取到

10. ACDC和BCDC中的的
    `createPayPalGuestOneTimePaymentSession`和`createCardFieldsComponent`的这2个关键地方的类型定义缺失了, 我确认查看过类型定义文件:
    ```ts
    export type SdkInstance<T extends readonly [Components, ...Components[]]> =
        BaseInstance &
            ("paypal-payments" extends T[number]
                ? PayPalPaymentsInstance
                : unknown) &
            ("venmo-payments" extends T[number] ? VenmoPaymentsInstance : unknown) &
            ("paypal-legacy-billing-agreements" extends T[number]
                ? PayPalLegacyBillingInstance
                : unknown);

    export interface BaseInstance {
        findEligibleMethods: (
            findEligibleMethodsOptions: FindEligibleMethodsOptions,
        ) => Promise<EligiblePaymentMethodsOutput>;
        updateLocale: (locale: string) => void;
    ```
    这其中没有定义BCDC和ACDC的情况

11. ACDC中调用`create-order`和`capture-order`的结构和PayPal按钮是不一样的. 
    PayPal的函数接受的返回格式是:
    ```json
    {
        orderId:string
    }
    ```
    而ACDC中接受的是一个string而不是一个object, 而且`capture-order`的形参也需要手动传递(这个倒是比较合理)

12. 文档中有残留: `paypal-credit-button`, 这个估计是以前的`Lit Web Component`. 是给BCDC的, 但是现在废弃不用了. 我们内部的confluence page上也是这个