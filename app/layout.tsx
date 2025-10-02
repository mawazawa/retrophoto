import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RetroPhoto - AI Photo Restoration',
  description: 'Preserve memories by turning old photos into realistic HD in seconds',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
