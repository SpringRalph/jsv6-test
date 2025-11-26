// 通用脚本动态加载器
// 支持单例+并发复用，自动卸载重载等功能

type ScriptState = {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  promise: Promise<void> | null;
};

// 存储所有脚本的状态
const scriptStates: Record<string, ScriptState> = {};

/**
 * 检查脚本是否已加载
 * @param src 脚本URL
 * @returns boolean
 */
export function isScriptLoaded(src: string): boolean {
  const state = scriptStates[src];
  return state ? state.loaded : false;
}

/**
 * 获取脚本的完整URL
 * @param src 脚本URL
 * @returns string | null
 */
export function getScriptSrc(src: string): string | null {
  if (isScriptLoaded(src)) {
    const script = document.querySelector(`script[src="${src}"]`);
    return script ? script.getAttribute("src") : null;
  }
  return null;
}

/**
 * 卸载脚本
 * @param src 脚本URL
 */
export function unloadScript(src: string): void {
  const script = document.querySelector(`script[src="${src}"]`);
  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }
  
  // 重置状态
  if (scriptStates[src]) {
    scriptStates[src] = {
      loading: false,
      loaded: false,
      error: null,
      promise: null
    };
  }
}

export interface ScriptLoadOptions {
  attributes?: Record<string, string>;
  waitForAttribute?: string;
}

/**
 * 加载脚本
 * @param src 脚本URL
 * @param options 加载选项
 * @returns Promise<void>
 */
export function loadScript(src: string, options: ScriptLoadOptions = {}): Promise<void> {
  // 如果脚本已经加载，直接返回
  if (isScriptLoaded(src)) {
    return Promise.resolve();
  }

  // 如果脚本正在加载中，返回现有的Promise
  if (scriptStates[src] && scriptStates[src].loading) {
    return scriptStates[src].promise || Promise.resolve();
  }

  // 创建新的状态
  scriptStates[src] = {
    loading: true,
    loaded: false,
    error: null,
    promise: null
  };

  // 创建Promise
  const promise = new Promise<void>((resolve, reject) => {
    // 创建script标签
    const script = document.createElement("script");
    script.src = src;
    
    // 设置属性
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
    }
    
    // 加载成功回调
    script.onload = () => {
      scriptStates[src] = {
        loading: false,
        loaded: true,
        error: null,
        promise: null
      };
      resolve();
    };
    
    // 加载失败回调
    script.onerror = () => {
      const error = new Error(`Failed to load script: ${src}`);
      scriptStates[src] = {
        loading: false,
        loaded: false,
        error,
        promise: null
      };
      reject(error);
    };
    
    // 添加到文档中
    document.head.appendChild(script);
  });

  // 保存Promise到状态中
  scriptStates[src].promise = promise;
  
  return promise;
}