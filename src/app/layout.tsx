import type { Metadata, Viewport } from 'next';
import { Outfit, Space_Grotesk, Cinzel } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-royal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VEDIKA AI TUTOR — Next-Gen Adaptive Cognitive Intelligence',
  description:
    'Experience the future of personalized education with Vedika AI Tutor. Real-time voice reasoning, adaptive concept modeling, and 24/7 interactive mastery.',
  keywords: [
    'AI Tutor',
    'Vedika AI',
    'Personalized Education',
    'Adaptive Learning',
    'STEM AI',
    'Cognitive Intelligence'
  ],
  authors: [{ name: 'Vedika Cognitive Labs' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${spaceGrotesk.variable} ${cinzel.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
