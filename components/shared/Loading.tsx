import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
}

export function Loading({ text = 'Cargando...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  )
}
