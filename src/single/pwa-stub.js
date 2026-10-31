// 한 파일 버전에는 서비스 워커가 없다 (vite.config.js 의 single 모드에서 virtual:pwa-register 대신 쓴다).
export function registerSW() { return () => {}; }
