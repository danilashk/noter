export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🧠 Live Brainstorm</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Возможности
              </a>
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                О проекте
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>Live Brainstorm - Современная доска для мозгового штурма с AI</p>
          <p className="text-sm mt-2">Next.js 15 • Supabase • Perplexity AI</p>
        </div>
      </footer>
    </div>
  )
}