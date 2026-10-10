// Static export can't do server redirects; a meta refresh works without JS.
import Link from 'next/link';

export default function Root() {
  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="refresh" content="0; url=/pt" />
      </head>
      <body>
        <Link href="/pt">PUC-SP Consolação · Mapa 3D</Link>
      </body>
    </html>
  );
}
