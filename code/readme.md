JS SDK v6 的使用心得:

1. 引入了类似工厂模式的 paypal 对象创建方式, 这使得单例模式的维护变得很简单. 本工程就是使用了单例模式
2. `getBrowserSafeClientToken`的代码实现文档写的很垃圾, 很容易注意不到. 实例代码中又是使用了`server sdk`来完成的. 不知道具体的`rest api`实现
    ```js
    const form = new URLSearchParams();
    form.append("grant_type", "client_credentials");
    form.append("response_type", "client_token");
    ```
3. 现在使用自定义的`DOM`元素对象: `paypal-button`. 这让基于react的项目变得很难受.
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


4. checkEligibilty的这个函数的请求很容易报错

5. 无论是内部文档还是online doc都没有提到 `createInstance()` 这个方法中可以传入 `testBuyerCountry`这个参数, 需要查看`typescript`的`d.ts`函数接口才可以

6. 没有办法渲染 `BCDC`

7. `<pay-later>`JSX元素不给`id`的话DOM渲染容易出问题 (存疑) | online-doc上使用的无`id`的example, code-sample中加了`id`
8. online doc完全没有说`css`样式的问题

