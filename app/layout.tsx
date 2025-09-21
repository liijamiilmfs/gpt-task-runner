import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Librán Voice Forge',
  description: 'Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.',
  keywords: ['translation', 'text-to-speech', 'fictional language', 'Librán', 'AI', 'voice synthesis'],
  authors: [{ name: 'Librán Voice Forge Team' }],
  openGraph: {
    title: 'Librán Voice Forge',
    description: 'Transform English text into the ancient language of Librán and bring it to life with AI-powered voice synthesis.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: 0
      }}>
        {children}
      </body>
    </html>
  )
}
