import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: { host: true },
  build: {
    // Phaser는 크기가 커서 따로 묶어 두면 게임 코드만 바뀔 때 다시 받지 않는다.
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    // 홈 화면 설치·오프라인·새 버전 안내 (tech-spec 9절, web-release 5절)
    VitePWA({
      registerType: 'prompt', // 새 버전을 바로 적용하지 않고, 타이틀·여권에서 안내 후 새로고침
      injectRegister: false,
      includeAssets: ['icons/favicon.svg', 'icons/favicon-32.png', 'icons/apple-touch-icon-180.png', 'og-image.png'],
      manifest: {
        id: '/',
        name: '블루나비의 세계여행',
        short_name: '블루나비',
        description: '파란 애벌레 블루나비가 한국에서 캐나다까지 여행하며 나비가 되는 귀여운 모험',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        background_color: '#e9d8b4',
        theme_color: '#e9d8b4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,webp,svg,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // 그림 파일은 ?v= 가 붙으므로 주소 뒤 글자를 무시하고 찾는다
        ignoreURLParametersMatching: [/^v$/],
      },
    }),
  ],
});
