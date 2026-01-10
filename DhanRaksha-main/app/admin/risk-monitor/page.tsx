import { Suspense } from "react"
import RiskMonitorContent from "./risk-monitor-content"

export default function RiskMonitorPage() {
  return (
    <Suspense fallback={null}>
      <RiskMonitorContent />
    </Suspense>
  )
}
