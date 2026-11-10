import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { ASSETS, ASSET_VERSION } from './src/data/assets.js';

// 모바일 최적화 (design-brief 14절): 앱 저장(서비스 워커)은 코드·글꼴·첫 화면 그림(boot)만 미리 받고,
// 나머지 그림은 처음 쓰는 순간 받아 'bb-art'에 저장한다 (한 번 받으면 인터넷 없이도).
const BOOT_ART = ASSETS.filter((a) => a.group === 'boot').map((a) => ({ url: a.file, revision: String(ASSET_VERSION) }));

// 한 파일 버전(vite build --mode single → scripts/build-single.mjs): 코드를 한 덩어리로 묶고 서비스 워커는 뺀다.
const single = {
  base: './',
  publicDir: false,
  resolve: { alias: { 'virtual:pwa-register': '/src/single/pwa-stub.js' } },
  build: {
    outDir: 'dist-single',
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
    chunkSizeWarningLimit: 4000,
  },
};

export default defineConfig(({ mode }) => mode === 'single' ? single : {
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
      includeAssets: ['icons/favicon.svg', 'icons/favicon-32.png', 'icons/apple-touch-icon-180.png'],
      manifest: {
        id: '/',
        name: '블루나비와 포포의 여행',
        short_name: '블루나비와 포포의 여행',
        description: '1탄 세계여행 · 2탄 사계절 서울 — 블루나비와 포포가 떠나는 귀여운 미로 모험',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        background_color: '#e9d8b4',
        theme_color: '#e9d8b4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,webmanifest}', 'icons/*.{png,svg}'],
        additionalManifestEntries: BOOT_ART,
        runtimeCaching: [{
          urlPattern: ({ url }) => /\/assets\/(char|face|item)\//.test(url.pathname),
          handler: 'CacheFirst',
          options: { cacheName: 'bb-art', expiration: { maxEntries: 300 } },
        }],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // 그림 파일은 ?v= 가 붙으므로 주소 뒤 글자를 무시하고 찾는다
        ignoreURLParametersMatching: [/^v$/],
        // 개인정보 안내 페이지는 게임 화면(index.html)으로 바꿔치기하지 않는다
        navigateFallbackDenylist: [/^\/privacy/],
      },
    }),
  ],
});
