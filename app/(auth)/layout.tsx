export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F428D] via-[#2d5aa8] to-[#1F428D]">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
