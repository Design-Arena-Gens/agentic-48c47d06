import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veo 3.1 AI Video Generator',
  description: 'Generate 8K Ultra Realistic Cinematic videos with Google Veo 3.1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
