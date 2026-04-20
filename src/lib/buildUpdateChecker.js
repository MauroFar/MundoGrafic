const CHECK_INTERVAL_MS = 60 * 1000;
let latestKnownAsset = null;

const getCurrentBundleSrc = () => {
  const script = document.querySelector('script[type="module"][src]');
  if (!script) return null;
  return script.getAttribute('src');
};

const extractBundleSrcFromIndex = (html) => {
  const match = html.match(/<script\s+type=["']module["']\s+[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const checkForNewBuild = async () => {
  if (!latestKnownAsset) return;

  try {
    const response = await fetch('/index.html', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) return;

    const html = await response.text();
    const nextAsset = extractBundleSrcFromIndex(html);

    if (!nextAsset) return;

    // Solo recargar cuando cambia el bundle compilado.
    if (nextAsset !== latestKnownAsset) {
      window.location.reload();
    }
  } catch {
    // Silencioso: si falla la red, se intentara en el siguiente ciclo.
  }
};

export const startBuildUpdateChecker = () => {
  if (typeof window === 'undefined') return;

  // En desarrollo no se aplica (Vite usa /src/main.jsx).
  latestKnownAsset = getCurrentBundleSrc();
  if (!latestKnownAsset || latestKnownAsset.includes('/src/')) return;

  setInterval(checkForNewBuild, CHECK_INTERVAL_MS);

  // Al volver a enfocar la pestana, revisa de inmediato.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForNewBuild();
    }
  });
};
