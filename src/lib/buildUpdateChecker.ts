const CHECK_INTERVAL_MS = 60 * 1000;
let latestKnownAsset: string | null = null;

const getCurrentBundleSrc = (): string | null => {
  const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
  return script?.getAttribute("src") ?? null;
};

const extractBundleSrcFromIndex = (html: string): string | null => {
  const match = html.match(/<script\s+type=["']module["']\s+[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const checkForNewBuild = async (): Promise<void> => {
  if (!latestKnownAsset) return;

  try {
    const response = await fetch("/index.html", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!response.ok) return;

    const html = await response.text();
    const nextAsset = extractBundleSrcFromIndex(html);
    if (!nextAsset) return;

    if (nextAsset !== latestKnownAsset) {
      window.location.reload();
    }
  } catch {
    // Silencioso: si falla la red, se intentará en el siguiente ciclo.
  }
};

export const startBuildUpdateChecker = (): void => {
  if (typeof window === "undefined") return;

  latestKnownAsset = getCurrentBundleSrc();
  // En desarrollo Vite usa /src/main.tsx — no aplicar.
  if (!latestKnownAsset || latestKnownAsset.includes("/src/")) return;

  setInterval(checkForNewBuild, CHECK_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForNewBuild();
    }
  });
};
