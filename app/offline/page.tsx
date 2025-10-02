export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">You're Offline</h1>
        <p className="text-muted-foreground">
          Your upload will sync when you're back online.
        </p>
      </div>
    </main>
  )
}
