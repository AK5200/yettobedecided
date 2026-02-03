export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ margin: 0, padding: 0, overflow: 'auto' }}>
        {children}
      </body>
    </html>
  )
}
