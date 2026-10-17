// 提词相机：离线缓存。改了文件就把版本号加一。
const CACHE = "tiqiqi-v2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 页面本身：有网先取最新版（3秒取不到就用缓存）；图标等文件：先用缓存。没网时全部走缓存。
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isPage = e.request.mode === "navigate" || /\/(index\.html)?$/.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (isPage) {
      const timeout = new Promise(res => setTimeout(() => res(null), 3000));
      const r = await Promise.race([net, timeout]);
      return r || hit || (await net) || new Response("离线中，且没有缓存", { status: 503 });
    }
    return hit || (await net) || new Response("离线中，且没有缓存", { status: 503 });
  }));
});
