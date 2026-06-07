import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExpiryTrack — Cluster Company',
  description: 'Service expiry tracking and renewal management for Cluster Company',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
