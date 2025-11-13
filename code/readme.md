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


