import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Thai Dummy',
  description: 'Play the Thai Rummy card game against the computer.',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

export default RootLayout
