import type { Metadata } from 'next'
import './globals.css'

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
      <body>
        {children}
      </body>
    </html>
  )
}
