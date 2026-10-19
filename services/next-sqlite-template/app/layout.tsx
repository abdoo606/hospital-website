import type { ReactNode } from 'react';
export const metadata = { title: 'Next + SQLite starter' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
