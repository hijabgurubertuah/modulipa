import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gamepad2, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Code2
} from 'lucide-react';

interface CustomGameRendererProps {
  code: string;
  gameType?: 'custom_html' | 'custom_tsx' | string;
  title?: string;
  instructions?: string;
  assets?: Array<{ name: string; emoji?: string; imageUrl?: string; color?: string }>;
  onComplete?: (score?: number) => void;
  className?: string;
}

export const CustomGameRenderer: React.FC<CustomGameRendererProps> = ({
  code,
  gameType = 'custom_html',
  title = 'Game Edukasi Interaktif',
  instructions,
  assets,
  onComplete,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameScore, setGameScore] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for messages from inside iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GAME_COMPLETE') {
        const score = typeof event.data.score === 'number' ? event.data.score : 100;
        setGameCompleted(true);
        setGameScore(score);
        if (onComplete) {
          onComplete(score);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  // Construct iframe srcDoc based on HTML or TSX/React
  const iframeSrcDoc = useMemo(() => {
    if (!code || !code.trim()) {
      return `<!DOCTYPE html>
        <html>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#94a3b8;font-family:sans-serif;text-align:center;">
            <p>Belum ada kode game yang dimasukkan.</p>
          </body>
        </html>`;
    }

    const assetsJson = JSON.stringify(assets || []);
    const imgFallbackScript = `
      <script>
        window.GAME_ASSETS = ${assetsJson};
        document.addEventListener('DOMContentLoaded', () => {
          const handleImgError = (img) => {
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('error', function() {
              if (this.dataset.fallbackSet) return;
              this.dataset.fallbackSet = 'true';
              const alt = this.alt || 'Gambar Game';
              this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23065f46" rx="16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="34">🌱</text><text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="11" font-weight="bold" font-family="sans-serif">' + encodeURIComponent(alt) + '</text></svg>';
            });
          };
          document.querySelectorAll('img').forEach(handleImgError);
          const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
              mutation.addedNodes.forEach(node => {
                if (node.tagName === 'IMG') handleImgError(node);
                else if (node.querySelectorAll) node.querySelectorAll('img').forEach(handleImgError);
              });
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
      </script>
    `;

    const trimmed = code.trim();
    const isTsx = gameType === 'custom_tsx' || trimmed.includes('import React') || trimmed.includes('export default') || trimmed.includes('useState(');

    if (isTsx) {
      // Clean up module imports for Babel browser standalone
      let transformedCode = trimmed;
      // Strip import statements that Babel standalone won't resolve locally
      transformedCode = transformedCode.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"][^'"]+['"];?/g, '');
      transformedCode = transformedCode.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?/g, '');
      transformedCode = transformedCode.replace(/import\s+[^;]+from\s+['"][^'"]+['"];?/g, '');

      // Identify main component name or convert export default to root render
      let componentName = 'App';
      const exportDefaultMatch = transformedCode.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
      if (exportDefaultMatch && exportDefaultMatch[1]) {
        componentName = exportDefaultMatch[1];
        transformedCode = transformedCode.replace(/export\s+default\s+function/, 'function');
      } else if (transformedCode.includes('export default')) {
        transformedCode = transformedCode.replace(/export\s+default\s+([A-Za-z0-9_]+);?/, (_, name) => {
          componentName = name;
          return '';
        });
      }

      return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${imgFallbackScript}
  <style>
    body { margin: 0; padding: 0; background: transparent; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
  </style>
</head>
<body class="p-2 sm:p-4">
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useMemo, useRef, useCallback } = React;
    const GAME_ASSETS = window.GAME_ASSETS || [];

    try {
      ${transformedCode}

      const rootElement = document.getElementById('root');
      if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        if (typeof ${componentName} !== 'undefined') {
          root.render(<${componentName} assets={GAME_ASSETS} />);
        } else {
          root.render(
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              Komponen React tidak ditemukan. Pastikan mendefinisikan komponen atau <code>export default function Game()</code>.
            </div>
          );
        }
      }
    } catch (err) {
      console.error(err);
      document.getElementById('root').innerHTML = \`
        <div style="background:#450a0a;color:#fca5a5;padding:16px;border-radius:12px;font-family:monospace;font-size:12px;border:1px solid #991b1b;">
          <strong>Error Kompilasi TSX:</strong><br/>
          \${err.message || err}
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    }

    // Standard HTML/JS
    // If user provided complete HTML document, inject our fallback script in head
    if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
      if (trimmed.includes('</head>')) {
        return trimmed.replace('</head>', `${imgFallbackScript}</head>`);
      }
      return `${imgFallbackScript}${trimmed}`;
    }

    // Wrap snippet in clean HTML5 environment with Tailwind
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${imgFallbackScript}
  <style>
    body { margin: 0; padding: 0; background: transparent; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
  </style>
</head>
<body class="p-2 sm:p-4">
  ${trimmed}
</body>
</html>`;
  }, [code, gameType, assets]);

  const handleRestart = () => {
    setReloadKey(prev => prev + 1);
    setGameCompleted(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full max-w-4xl mx-auto'
      } ${className}`}
    >
      {/* Game Header Bar */}
      <div className="bg-slate-800/95 backdrop-blur-md px-4 py-3 border-b border-slate-700/80 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Gamepad2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                {title}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase shrink-0">
                {gameType === 'custom_tsx' ? 'TSX / React' : 'HTML5'}
              </span>
            </div>
            {gameCompleted && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Game Berhasil Diselesaikan!
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {instructions && (
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showInstructions 
                  ? 'bg-amber-400 text-slate-900 font-bold shadow-md' 
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
              title="Petunjuk Bermain"
            >
              <Info size={14} />
              <span className="hidden sm:inline">Petunjuk</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-700/60 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Muat Ulang Game"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Ulangi</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-600/80 hover:bg-indigo-600 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden md:inline">{isFullscreen ? 'Kecilkan' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Instructions Drawer */}
      {instructions && showInstructions && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-xs text-amber-200 flex items-start gap-2.5">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold text-amber-300">Cara Bermain:</strong>
            <p className="leading-relaxed whitespace-pre-wrap">{instructions}</p>
          </div>
        </div>
      )}

      {/* Game Stage (Iframe Container) */}
      <div className={`w-full relative bg-slate-950 flex flex-col justify-center items-center ${isFullscreen ? 'flex-1 h-full' : 'min-h-[460px] sm:min-h-[520px]'}`}>
        <iframe
          key={reloadKey}
          srcDoc={iframeSrcDoc}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          className="w-full h-full min-h-[460px] sm:min-h-[520px] border-0 rounded-b-2xl overflow-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </div>

      {/* Bottom Completion Action / Status Bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Code2 size={13} className="text-indigo-400" />
          <span className="text-[11px]">Interaktif HTML5/TSX Engine</span>
        </span>

        <button
          type="button"
          onClick={() => {
            setGameCompleted(true);
            if (onComplete) onComplete(100);
          }}
          className="px-3.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 size={14} />
          <span>{gameCompleted ? 'Game Selesai ✓' : 'Tandai Selesai & Lanjut'}</span>
        </button>
      </div>
    </div>
  );
};
