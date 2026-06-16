import consola from "consola";
import { useErrorDialogStore } from "@/store/useErrorDialogStore";

/**
 * 包一层 sdkInstance.findEligibleMethods：
 * - 成功：返回原始结果
 * - 失败：consola.error + 弹全局错误对话框 + 返回 null
 *
 * caller 用法：
 *   const paymentMethods = await safeFindEligibleMethods(sdkInstance, { currencyCode: "EUR" });
 *   if (!paymentMethods) return;
 */
export async function safeFindEligibleMethods(
  sdkInstance: any,
  params?: any,
): Promise<any | null> {
  try {
    return params === undefined
      ? await sdkInstance.findEligibleMethods()
      : await sdkInstance.findEligibleMethods(params);
  } catch (err: any) {
    consola.error("findEligibleMethods failed:", err);
    useErrorDialogStore.getState().show({
      title: "Find Eligible Methods Failed",
      message: err?.message ?? String(err),
      details: err,
    });
    return null;
  }
}
