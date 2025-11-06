"use client"

import { useState } from "react"
import { useEnvStore } from "@/store/useEnvStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"

export function EnvPanel() {
  const { clientId, secret, setClientId, setSecret, reset } = useEnvStore()
  const [localClientId, setLocalClientId] = useState(clientId)
  const [localSecret, setLocalSecret] = useState(secret)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setClientId(localClientId)
    setSecret(localSecret)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    reset()
    setLocalClientId("")
    setLocalSecret("")
  }

  return (
    <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        Environment Configuration
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium mb-2 flex items-center gap-2">
            <span className="text-lg">🔑</span>
            PayPal Client ID
          </label>
          <Input
            id="clientId"
            type="text"
            value={localClientId}
            onChange={(e) => setLocalClientId(e.target.value)}
            placeholder="Enter your PayPal Client ID"
            className="border-2"
          />
        </div>

        <div>
          <label htmlFor="secret" className="block text-sm font-medium mb-2 flex items-center gap-2">
            <span className="text-lg">🔐</span>
            PayPal Secret
          </label>
          <Input
            id="secret"
            type="password"
            value={localSecret}
            onChange={(e) => setLocalSecret(e.target.value)}
            placeholder="Enter your PayPal Secret"
            className="border-2"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={handleSave} className="shadow-md hover:shadow-lg transition-shadow">
            💾 Save Configuration
          </Button>
          <Button onClick={handleReset} variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
            🔄 Reset
          </Button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
              ✅ Saved successfully
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
