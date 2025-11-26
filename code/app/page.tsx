import { Container } from "@/components/layout/Container";
import { EnvPanel } from "@/components/panels/EnvPanel";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { Loader2Icon, AlertTriangleIcon, CheckIcon, LightbulbIcon } from 'lucide-react';

// 定义工作状态的样式配置
const workStageConfig = {
  0: {
    bgColor: 'bg-white dark:bg-gray-900',
    textColor: 'text-gray-800 dark:text-gray-200',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: null,
    label: '未开始'
  },
  1: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Loader2Icon,
    label: '进行中'
  },
  2: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-800 dark:text-red-200',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertTriangleIcon,
    label: '有问题'
  },
  3: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: LightbulbIcon,
    label: '技术限制'
  },
  4: {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-800 dark:text-green-200',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckIcon,
    label: '已完成'
  }
} as const;

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

    const groupEmojis: Record<string, string> = {
        Buttons: "🔘",
        Browser: " 🌐 ",
        Messaging: "💬",
        Advanced: "⚡",
        Vault: " 🗝️ ",
        APM: " 🔄 ",
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
                                ⚠️ Test Case有5个状态: 未开始, 进行中, 有问题, 技术限制无法在本页面中实现, 已完成
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
                                            {groupEmojis[group]}
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
                                          
                                          return (
                                            <Link
                                                key={route.path}
                                                href={route.path}
                                                className={`group relative block p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${stageConfig.borderColor} ${stageConfig.bgColor}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative">
                                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${stageConfig.textColor}`}>
                                                        <span className="text-xl">
                                                            ▶️
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
