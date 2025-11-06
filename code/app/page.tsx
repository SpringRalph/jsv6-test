import { Container } from "@/components/layout/Container"
import { EnvPanel } from "@/components/panels/EnvPanel"
import { routes } from "@/lib/routes"
import Link from "next/link"

export default function HomePage() {
  // Group routes by category
  const groupedRoutes = routes.reduce(
    (acc, route) => {
      if (!acc[route.group]) {
        acc[route.group] = []
      }
      acc[route.group].push(route)
      return acc
    },
    {} as Record<string, typeof routes>,
  )

  const groupEmojis: Record<string, string> = {
    Buttons: "🔘",
    Messaging: "💬",
    Advanced: "⚡",
  }

  return (
    <Container>
      <div className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-3xl -z-10" />
          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl">💳</span>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PayPal JS v6 Test Framework
              </h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="text-xl">🧪</span>A unified testing environment for PayPal JavaScript SDK v6 examples
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
            {Object.entries(groupedRoutes).map(([group, groupRoutes]) => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{groupEmojis[group]}</span>
                  <h3 className="text-lg font-medium text-primary">{group}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupRoutes.map((route) => (
                    <Link
                      key={route.path}
                      href={route.path}
                      className="group relative block p-6 bg-card border-2 border-border rounded-xl hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <span className="text-xl">▶️</span>
                          {route.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                      </div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-primary/20 rounded-full group-hover:scale-150 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
