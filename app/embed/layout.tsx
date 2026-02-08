export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ height: '100%', width: '100%' }}>
      <body className="antialiased" style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%', width: '100%' }}>
        {children}
      </body>
    </html>
  )
}
