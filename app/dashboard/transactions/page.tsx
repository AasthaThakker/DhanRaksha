import { Suspense } from "react"
import TransactionsContent from "./transactions-content"

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  )
}
