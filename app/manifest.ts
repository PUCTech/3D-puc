import type { MetadataRoute } from 'next';

export const dynamic = 'force-static'; // static export

// "Add to Home Screen" opens the map full screen, without Safari's toolbar (a browser tab can't hide it).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mapa 3D · PUC-SP Consolação',
    short_name: 'Mapa PUC',
    start_url: '/pt',
    display: 'standalone',
    background_color: '#b7ab98',
    theme_color: '#143966',
    icons: [{ src: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  };
}
