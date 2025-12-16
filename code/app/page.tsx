// 移除不必要的React导入
import { Container } from "@/components/layout/Container";
import { EnvPanel } from "@/components/panels/EnvPanel";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { renderPanelIcon, workStageConfig } from "@/lib/utils/homepage-lucide-icon-helper";
import { 
  MousePointerClick,
  Globe, 
  MessageSquare, 
  Zap, 
  Key, 
  RefreshCcw 
} from 'lucide-react';


type WorkStage = keyof typeof workStageConfig;

export default function HomePage() {
    // Group routes by category
    const groupedRoutes = routes.reduce((acc, route) => {
        if (!acc[route.group]) {
            acc[route.group] = [];
        }
        acc[route.group].push(route);
        return acc;
    }, {} as Record<string, typeof routes>);

    const groupIcons: Record<string, React.ReactNode> = {
        Buttons: <MousePointerClick className="w-5 h-5" />,
        Browser: <Globe className="w-5 h-5" />,
        PayLater: <MessageSquare className="w-5 h-5" />,
        Advanced: <Zap className="w-5 h-5" />,
        Vault: <Key className="w-5 h-5" />,
        APM: <RefreshCcw className="w-5 h-5" />,
    };

    // 获取工作状态配置
    const getWorkStageConfig = (stage: number | undefined) => {
        const validStage = stage !== undefined && stage >= 0 && stage <= 4 ? stage : 0;
        return workStageConfig[validStage as WorkStage];
    };

    return (
        <Container>
            <div className="space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-3xl -z-10" />
                    <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-5xl">💳</span>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                A unified testing environment for PayPal
                                JavaScript SDK v6 examples
                            </h1>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="text-xm">
                                🧪PayPal JS v6 is a brand new experience brought
                                to you by our development team after studying
                                competitor SDKs, especially Stripe's. <br />
                                🧪PayPal JS v6
                                是开发团队在研究了友商(特别是stripe)SDK后,
                                给大家带来的全新体验! <br/>
                                ⚠️ Test Case有5个状态: 
                                <span className="inline-flex flex-wrap gap-2 mt-2 ml-2">
                                    <span className="px-3 py-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium">
                                        未开始
                                    </span>
                                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-medium">
                                        进行中
                                    </span>
                                    <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-full text-xs font-medium">
                                        有问题
                                    </span>
                                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800 rounded-full text-xs font-medium">
                                        需要注意
                                    </span>
                                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium">
                                        已完成
                                    </span>
                                </span>
                            </span>
                        </p>
                    </div>
                </div>

                <EnvPanel />

                <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <span className="text-3xl">📋</span>
                        Test Examples
                    </h2>
                    <div className="space-y-6">
                        {Object.entries(groupedRoutes).map(
                            ([group, groupRoutes]) => (
                                <div key={group}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">
                                            {groupIcons[group]}
                                        </span>
                                        <h3 className="text-lg font-medium text-primary">
                                            {group}
                                        </h3>
                                        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-3" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groupRoutes.map((route) => {
                                          const stageConfig = getWorkStageConfig(route.workStage);
                                          const IconComponent = stageConfig.icon;
                                          // 检查是否是sandboxedIframe路由
                                          const isSandboxedIframe = route.path === "/jsv6-test-cases/browser-display/sandboxedIframe";
                                          // 如果是sandboxedIframe路由，使用外部URL，否则使用内部路由
                                          const href = isSandboxedIframe ? "https://ppgms-test.github.io/jsv6-test/iframe-hostpage.html" : route.path;
                                          
                                          return (
                                            <Link
                                                key={route.path}
                                                href={href}
                                                target={isSandboxedIframe ? "_blank" : "_self"}
                                                className={`group relative block p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${stageConfig.borderColor} ${stageConfig.bgColor}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative">
                                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${stageConfig.textColor}`}>
                                                        <span className="text-xl">
                                                            {renderPanelIcon(route.panelIcon)}
                                                        </span>
                                                        {route.title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {route.description}
                                                    </p>
                                                </div>
                                                {/* 工作状态指示器 */}
                                                {IconComponent && (
                                                  <div className={`absolute top-2 right-2 p-1 rounded-full ${stageConfig.bgColor} ${stageConfig.textColor}`}>
                                                    <IconComponent className="w-4 h-4" />
                                                  </div>
                                                )}
                                                {!IconComponent && (
                                                  <div className="absolute top-2 right-2 w-2 h-2 bg-primary/20 rounded-full group-hover:scale-150 transition-transform" />
                                                )}
                                            </Link>
                                          );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
}
