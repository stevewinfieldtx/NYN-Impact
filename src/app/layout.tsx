import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NYN Impact | Websites That Could Only Be Yours',
  description: 'We interview you, research your competitors, and build a website that could only be yours. Then you edit it yourself — just by talking to it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
