'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getAdsterraConfig } from '@/lib/store';

interface AdsterraAdProps {
  type: 'banner_728x90' | 'banner_300x250' | 'native';
  codeSnippet?: string;
}

export default function AdsterraAd({ type, codeSnippet }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    }
    loadConfig();
  }, [type, codeSnippet]);

  useEffect(() => {
    if (activeSnippet && containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const width = type === 'banner_728x90' ? '728px' : '300px';
      const height = type === 'banner_728x90' ? '90px' : '250px';

      const iframe = document.createElement('iframe');
      iframe.style.width = width;
      iframe.style.height = height;
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.background = 'transparent';
      iframe.setAttribute('scrolling', 'no');

      containerRef.current.appendChild(iframe);

      try {
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; }
                </style>
              </head>
              <body>
                ${activeSnippet}
              </body>
            </html>
          `);
          doc.close();
        }
      } catch (err) {
        console.error('Error populating Adsterra iframe:', err);
      }
    }
  }, [activeSnippet, type]);

  if (type === 'banner_728x90') {
    return (
      <div className="w-full flex flex-col items-center justify-center my-6">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Publicité</span>
        <div
          ref={containerRef}
          className="w-full max-w-[728px] h-[90px] bg-zora-card border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
        >
          {!activeSnippet && (
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
        <div
          ref={containerRef}
          className="w-[300px] h-[250px] bg-zora-card border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
        >
          {!activeSnippet && (
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
      <div ref={containerRef} className="min-h-[100px] flex items-center justify-center text-xs text-gray-400">
        {!activeSnippet && <span>Adsterra Native Ad Container</span>}
      </div>
    </div>
  );
}
