import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Inbox Detoxer',
  description: 'Clean up your inbox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
