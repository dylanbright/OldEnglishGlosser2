
import React, { useState } from 'react';
import { GlossToken } from '../types';
import { GlossaryPanel } from './GlossaryPanel';
import { StudyList } from './StudyList';

interface GlossViewProps {
  tokens: GlossToken[];
  onToggleFlag: (index: number) => void;
  onUpdateToken: (index: number, updates: Partial<GlossToken>) => void;
}

const NO_SPACE_AFTER = new Set([
  '(', '[', '{', '“', '‘', '#', '$', '¿', '¡', '<'
]);

export const GlossView: React.FC<GlossViewProps> = ({ tokens, onToggleFlag, onUpdateToken }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const flaggedIndices = new Set(
    tokens
      .map((token, idx) => token.isFlagged ? idx : -1)
      .filter(idx => idx !== -1)
  );

  const quoteStateMap = new Map<number, 'open' | 'close'>();
  let quoteOpen = false;
  tokens.forEach((token, idx) => {
    if (token.original.trim() === '"') {
      if (quoteOpen) {
        quoteStateMap.set(idx, 'close');
        quoteOpen = false;
      } else {
        quoteStateMap.set(idx, 'open');
        quoteOpen = true;
      }
    }
  });

  const getContextAt = (index: number): string => {
    const start = Math.max(0, index - 10);
    const end = Math.min(tokens.length - 1, index + 10);
    return tokens.slice(start, end + 1).map(t => t.original === '\n' ? ' ' : t.original).join(' ').replace(/\s+/g, ' ');
  };

  const isLeftAttaching = (token: GlossToken, index: number) => {
    if (!token) return false;
    const text = token.original.trim();
    if (!text) return false;
    if (text === '"') return quoteStateMap.get(index) === 'close';
    if (token.isPunctuation) {
        if (text === '-' || text === '–' || text === '—') return false; 
        if (text === '&') return false;
        if (NO_SPACE_AFTER.has(text)) return false;
        return true;
    }
    return false;
  };

  const isRightAttaching = (token: GlossToken, index: number) => {
    if (!token) return false;
    const text = token.original.trim();
    if (text === '"') return quoteStateMap.get(index) === 'open';
    if (NO_SPACE_AFTER.has(text)) return true;
    return false;
  };

  const hasPadding = (token: GlossToken) => !token.isPunctuation;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700">
      
      <div className="hidden lg:block">
        <StudyList 
          tokens={tokens} 
          flaggedIndices={flaggedIndices} 
          onSelectToken={setActiveIndex}
          activeIndex={activeIndex}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-parchment-100 p-6 lg:p-12 shadow-inner lg:shadow-none">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-xl prose-p:font-serif prose-p:text-2xl prose-p:leading-loose text-parchment-900 text-justify">
            <p className="flex flex-wrap items-baseline content-start">
              {tokens.map((token, index) => {
                const isNewline = token.original === '\n' || token.original === '\\n';
                if (isNewline) {
                    return <span key={index} className="w-full h-4 block basis-full"></span>;
                }

                const isActive = activeIndex === index;
                const isFlagged = !!token.isFlagged;
                const isPunc = token.isPunctuation;
                
                const nextToken = tokens[index + 1];
                const attachToNext = 
                  (isRightAttaching(token, index)) || 
                  (nextToken && isLeftAttaching(nextToken, index + 1));

                let marginClass = 'mr-1.5';

                if (attachToNext) {
                  const currentHasPad = hasPadding(token);
                  const nextHasPad = nextToken && hasPadding(nextToken);

                  if (currentHasPad && nextHasPad) {
                    marginClass = '-mr-2';
                  } else if (currentHasPad || nextHasPad) {
                    marginClass = '-mr-1.5';
                  } else {
                    marginClass = 'mr-0';
                  }
                }

                if (isPunc) {
                  return (
                    <span 
                      key={index}
                      className={`
                        inline-block relative text-parchment-800
                        ${marginClass}
                      `}
                    >
                      {token.original}
                    </span>
                  );
                }

                return (
                  <span
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`
                      inline-block relative cursor-pointer transition-all duration-200 rounded px-1
                      ${marginClass}
                      ${isActive 
                        ? 'bg-parchment-300 shadow-sm z-10 scale-105 font-medium' 
                        : 'hover:bg-parchment-200'}
                      ${isFlagged && !isActive
                        ? 'text-red-900 bg-red-100/50 decoration-red-200/50'
                        : 'text-parchment-900'}
                      ${isFlagged && isActive
                         ? 'text-red-950 ring-1 ring-red-900/20'
                         : ''}
                    `}
                  >
                    {token.original}
                  </span>
                );
              })}
            </p>
          </div>
          
          <div className="mt-16 pt-8 border-t border-parchment-300 text-center">
             <span className="text-parchment-500 text-sm font-serif italic">
               (Click words to view their gloss)
             </span>
          </div>
        </div>
      </div>

      <div className="h-64 lg:h-auto lg:w-[400px] xl:w-[480px] flex-shrink-0 z-20 shadow-2xl lg:shadow-none">
        <GlossaryPanel
          token={activeIndex !== null ? tokens[activeIndex] : null}
          context={activeIndex !== null ? getContextAt(activeIndex) : undefined}
          isFlagged={activeIndex !== null ? !!tokens[activeIndex]?.isFlagged : false}
          onToggleFlag={() => activeIndex !== null && onToggleFlag(activeIndex)}
          onUpdateToken={(updates) => activeIndex !== null && onUpdateToken(activeIndex, updates)}
        />
      </div>
      
    </div>
  );
};
