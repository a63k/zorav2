'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getAdsterraConfig } from '@/lib/store';

interface AdsterraAdProps {
  type: 'banner_728x90' | 'banner_300x250' | 'native';
  codeSnippet?: string;
}

export default function AdsterraAd({ type, codeSnippet }: AdsterraAdProps) {
  const [activeSnippet, setActiveSnippet] = useState<string | undefined>(codeSnippet);

  useEffect(() => {
    if (codeSnippet) {
      setActiveSnippet(codeSnippet);
      return;
    }

    async function loadConfig() {
      const config = await getAdsterraConfig();
      if (type === 'banner_728x90' && config.banner_728x90) {
        setActiveSnippet(config.banner_728x90);
      } else if (type === 'banner_300x250' && config.banner_300x250) {
        setActiveSnippet(config.banner_300x250);
      }

      // Inject Popunder script globally if configured
      if (config.popunder && typeof document !== 'undefined' && !document.getElementById('adsterra-popunder-script')) {
        try {
          const range = document.createRange();
          const fragment = range.createContextualFragment(config.popunder);
          const scriptTag = fragment.querySelector('script');
          if (scriptTag) {
            const newScript = document.createElement('script');
            newScript.id = 'adsterra-popunder-script';
            if (scriptTag.src) newScript.src = scriptTag.src;
            if (scriptTag.innerHTML) newScript.innerHTML = scriptTag.innerHTML;
            document.head.appendChild(newScript);
          }
        } catch (e) {}
      }
    }
    loadConfig();
  }, [type, codeSnippet]);

  const srcDocContent = activeSnippet
    ? `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; }
    </style>
  </head>
  <body>
    ${activeSnippet}
  </body>
</html>`
    : undefined;

  if (type === 'banner_728x90') {
    return (
      <div className="w-full flex flex-col items-center justify-center my-6">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Publicité</span>
        <div className="w-full max-w-[728px] h-[90px] bg-zora-card border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
          {srcDocContent ? (
            <iframe
              srcDoc={srcDocContent}
              title="Adsterra Banner 728x90"
              className="w-full h-full border-0 overflow-hidden bg-transparent"
              scrolling="no"
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="w-4 h-4 text-purple-400" />
              <span>Adsterra Leaderboard (728x90)</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'banner_300x250') {
    return (
      <div className="flex flex-col items-center justify-center my-4">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Sponsorisé</span>
        <div className="w-[300px] h-[250px] bg-zora-card border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
          {srcDocContent ? (
            <iframe
              srcDoc={srcDocContent}
              title="Adsterra Banner 300x250"
              className="w-full h-full border-0 overflow-hidden bg-transparent"
              scrolling="no"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-xs text-gray-400 p-4 text-center">
              <ExternalLink className="w-5 h-5 text-purple-400" />
              <span>Adsterra Rectangle (300x250)</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-6 bg-zora-card/60 border border-white/10 rounded-2xl p-4">
      <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Recommandé pour vous</span>
      <div className="min-h-[100px] flex items-center justify-center text-xs text-gray-400">
        {srcDocContent ? (
          <iframe
            srcDoc={srcDocContent}
            title="Adsterra Native Banner"
            className="w-full min-h-[100px] border-0 overflow-hidden bg-transparent"
            scrolling="no"
          />
        ) : (
          <span>Adsterra Native Ad Container</span>
        )}
      </div>
    </div>
  );
}

