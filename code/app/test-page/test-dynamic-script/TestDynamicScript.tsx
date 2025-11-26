"use client";

import React, { useState } from "react";
import { usePayPalWebSdk, PAYPALSDKURL } from "@/hooks/usePayPalWebSdk";
import { useCustomScript } from "@/hooks/useCustomScript";

const TestDynamicScript: React.FC = () => {
  const [paypalEnv, setPaypalEnv] = useState<PAYPALSDKURL>(PAYPALSDKURL.SANDBOX_SRC);
  const [customUrl, setCustomUrl] = useState<string>("");

  // 使用 PayPal 脚本钩子
  const { ready: paypalReady, loading: paypalLoading, error: paypalError } = usePayPalWebSdk(paypalEnv);

  // 使用自定义脚本钩子
  const { ready: customReady, loading: customLoading, error: customError } = useCustomScript(customUrl);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">动态脚本加载测试</h1>
      
      {/* PayPal 脚本测试 */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">PayPal 脚本测试</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">选择环境:</label>
            <select 
              value={paypalEnv}
              onChange={(e) => setPaypalEnv(e.target.value as PAYPALSDKURL)}
              className="border p-2 rounded"
            >
              <option value={PAYPALSDKURL.SANDBOX_SRC}>沙盒环境</option>
              <option value={PAYPALSDKURL.PRODUCTION_SRC}>生产环境</option>
            </select>
          </div>
          
          <div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              重新加载页面
            </button>
          </div>
          
          <div className="mt-4">
            <p>加载状态: {paypalLoading ? "加载中..." : paypalReady ? "已加载" : "未加载"}</p>
            {paypalError && <p className="text-red-500">错误: {paypalError.message}</p>}
          </div>
        </div>
      </div>
      
      {/* 自定义脚本测试 */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">自定义脚本测试</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">输入脚本 URL:</label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/script.js"
              className="border p-2 rounded w-full"
            />
          </div>
          
          <div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              重新加载页面
            </button>
          </div>
          
          <div className="mt-4">
            <p>加载状态: {customLoading ? "加载中..." : customReady ? "已加载" : "未加载"}</p>
            {customError && <p className="text-red-500">错误: {customError.message}</p>}
          </div>
        </div>
      </div>
      
      {/* 测试说明 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">测试说明:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>选择不同的 PayPal 环境来测试脚本加载</li>
          <li>输入任何有效的 JavaScript 文件 URL 来测试自定义脚本加载</li>
          <li>观察加载状态和可能出现的错误信息</li>
          <li>使用重新加载按钮来测试重复加载场景</li>
        </ul>
      </div>
    </div>
  );
};

export default TestDynamicScript;