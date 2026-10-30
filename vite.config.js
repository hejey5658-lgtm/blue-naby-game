import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true },
  build: {
    // Phaser는 크기가 커서 따로 묶어 두면 게임 코드만 바뀔 때 다시 받지 않는다.
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600,
  },
});
