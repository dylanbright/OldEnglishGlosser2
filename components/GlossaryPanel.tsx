
import React, { useState, useEffect } from 'react';
import { GlossToken } from '../types';
import { BookMarked, ExternalLink, Library, Bookmark, Edit2, Check, X, Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';
import { deepAnalyzeToken } from '../services/claudeService';

interface GlossaryPanelProps {
  token: GlossToken | null;
  context?: string;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  onUpdateToken?: (updates: Partial<GlossToken>) => void;
}

export const GlossaryPanel: React.FC<GlossaryPanelProps> = ({
  token,
  context = "",
  isFlagged = false,
  onToggleFlag,
  onUpdateToken,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<GlossToken>>({});

  useEffect(() => {
    setIsEditing(false);
    if (token) {
      setFormData({
        original: token.original,
        lemma: token.lemma,
        partOfSpeech: token.partOfSpeech,
        modernTranslation: token.modernTranslation,
        grammaticalInfo: token.grammaticalInfo,
        etymology: token.etymology
      });
    }
  }, [token]);

  const handleSave = () => {
    if (onUpdateToken) {
      onUpdateToken(formData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (token) {
        setFormData({
            original: token.original,
            lemma: token.lemma,
            partOfSpeech: token.partOfSpeech,
            modernTranslation: token.modernTranslation,
            grammaticalInfo: token.grammaticalInfo,
            etymology: token.etymology
        });
    }
  };

  const handleDeepCheck = async () => {
    if (!token || !onUpdateToken) return;
    setIsDeepLoading(true);
    try {
      const result = await deepAnalyzeToken(token, context);
      onUpdateToken({ ...result.updates, sources: result.sources, isAnalyzed: true });
    } catch (error) {
      alert("The deep search encountered a storm in the North Sea. Please try again later.");
    } finally {
      setIsDeepLoading(false);
    }
  };

  const handleChange = (field: keyof GlossToken, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!token) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-parchment-500 p-8 text-center border-l border-parchment-300/50 bg-parchment-100/50">
        <div className="bg-parchment-200 p-4 rounded-full mb-4">
          <BookMarked size={32} className="text-parchment-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-parchment-700">Glossary Empty</h3>
        <p className="text-sm max-w-[200px]">Click a word in the text to reveal its philological secrets.</p>
      </div>
    );
  }

  if (token.isPunctuation) {
     return (
      <div className="h-full flex flex-col items-center justify-center text-parchment-500 p-8 text-center border-l border-parchment-300/50 bg-parchment-100/50">
        <div className="bg-parchment-200 p-4 rounded-full mb-4">
          <span className="text-4xl font-serif text-parchment-800">{token.original}</span>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-parchment-700">Punctuation</h3>
        <p className="text-sm">Syntactic separator.</p>
      </div>
    );
  }

  if (token.isAnalyzed === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-parchment-500 p-8 text-center border-l border-parchment-300/50 bg-parchment-100/50">
        <h2 className="text-5xl font-serif font-bold text-parchment-900 mb-3">{token.original}</h2>
        <p className="text-sm text-parchment-500 italic mb-6">Not yet analyzed.</p>
        <button
          onClick={handleDeepCheck}
          disabled={isDeepLoading}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold uppercase tracking-wide
            ${isDeepLoading
              ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed'
              : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}
          `}
        >
          {isDeepLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Analyze with AI
        </button>
      </div>
    );
  }

  const bosworthTollerUrl = `https://bosworthtoller.com/search?q=${encodeURIComponent(token.lemma)}`;
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(token.lemma)}#Old_English`;

  return (
    <div className="h-full overflow-y-auto border-l border-parchment-300 bg-parchment-50 shadow-inner relative">
      <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300 pb-20">
        
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <button 
                            onClick={handleSave}
                            className="p-1.5 rounded-full bg-parchment-600 text-white hover:bg-parchment-700 transition-colors"
                            title="Save Changes"
                        >
                            <Check size={16} />
                        </button>
                        <button 
                            onClick={handleCancel}
                            className="p-1.5 rounded-full bg-parchment-200 text-parchment-600 hover:bg-parchment-300 transition-colors"
                            title="Cancel Editing"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-full hover:bg-parchment-200 text-parchment-500 hover:text-parchment-800 transition-all"
                        title="Edit Gloss Info"
                    >
                        <Edit2 size={16} />
                    </button>
                )}
             </div>

             <div className="flex items-center gap-2">
                {!isEditing && (
                    <button
                        onClick={handleDeepCheck}
                        disabled={isDeepLoading}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wide
                            ${isDeepLoading 
                                ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed' 
                                : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}
                        `}
                    >
                        {isDeepLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Sparkles size={14} />
                        )}
                        Check Again with AI
                    </button>
                )}

                <label className={`
                    flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border transition-all select-none
                    ${isFlagged 
                        ? 'bg-red-50 border-red-200 text-red-900' 
                        : 'bg-parchment-100 border-parchment-200 text-parchment-600 hover:bg-white'}
                `}>
                    <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isFlagged}
                        onChange={onToggleFlag}
                    />
                    <Bookmark size={16} className={isFlagged ? "fill-red-800" : ""} />
                    <span className="text-xs font-bold tracking-wide uppercase">
                        {isFlagged ? 'Flagged' : 'Flag'}
                    </span>
                </label>
             </div>
        </div>

        <div className="border-b-2 border-parchment-200 pb-6 -mt-2">
            {isEditing ? (
                <div className="flex flex-col gap-2 mb-2">
                    <label className="text-[10px] font-bold text-parchment-500 uppercase">Part of Speech</label>
                    <input 
                        type="text" 
                        value={formData.partOfSpeech || ''} 
                        onChange={(e) => handleChange('partOfSpeech', e.target.value)}
                        className="bg-parchment-100 border-b border-parchment-300 focus:border-parchment-600 text-sm font-bold tracking-wider text-parchment-700 uppercase rounded px-2 py-1 outline-none"
                    />
                </div>
            ) : (
                <span className="inline-block px-2 py-1 mb-2 text-xs font-bold tracking-wider text-parchment-600 uppercase bg-parchment-200 rounded">
                    {token.partOfSpeech}
                </span>
            )}
            
            {isEditing ? (
                <input
                    type="text"
                    value={formData.original || ''}
                    onChange={(e) => handleChange('original', e.target.value)}
                    className="text-5xl font-serif font-bold text-parchment-900 mb-2 bg-transparent border-b border-parchment-400 focus:border-parchment-800 outline-none w-full"
                />
            ) : (
                <h2 className="text-5xl font-serif font-bold text-parchment-900 mb-2">{token.original}</h2>
            )}
            
            <div className="flex items-baseline gap-2 text-parchment-600 font-serif italic text-xl">
                <span>from</span>
                {isEditing ? (
                    <input 
                        type="text"
                        value={formData.lemma || ''}
                        onChange={(e) => handleChange('lemma', e.target.value)}
                         className="bg-transparent border-b border-parchment-400 focus:border-parchment-800 text-parchment-800 font-semibold not-italic outline-none w-32"
                    />
                ) : (
                    <span className="font-semibold text-parchment-800 not-italic">"{token.lemma}"</span>
                )}
            </div>
        </div>

        <div>
            <h4 className="text-xs font-bold text-parchment-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-parchment-400"></span>
                Modern Meaning
            </h4>
            {isEditing ? (
                <textarea
                    value={formData.modernTranslation || ''}
                    onChange={(e) => handleChange('modernTranslation', e.target.value)}
                    className="w-full bg-transparent border border-parchment-300 focus:border-parchment-500 rounded p-2 text-xl font-serif text-parchment-900 outline-none resize-y min-h-[80px]"
                />
            ) : (
                <p className="text-2xl font-serif text-parchment-900 leading-relaxed">
                    {token.modernTranslation}
                </p>
            )}
        </div>

        <div className="bg-parchment-100 rounded-xl p-6 border border-parchment-200">
            <h4 className="text-xs font-bold text-parchment-500 uppercase tracking-widest mb-4">
                Grammatical Analysis
            </h4>
            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-parchment-500 mb-1">Morphology</span>
                    {isEditing ? (
                         <textarea
                            value={formData.grammaticalInfo || ''}
                            onChange={(e) => handleChange('grammaticalInfo', e.target.value)}
                            className="w-full bg-white/50 border border-parchment-300 focus:border-parchment-500 rounded p-2 text-base font-medium text-parchment-800 outline-none resize-y"
                        />
                    ) : (
                        <span className="font-medium text-parchment-800 text-lg">{token.grammaticalInfo}</span>
                    )}
                </div>
            </div>
        </div>

        {(token.etymology || isEditing) && (
            <div>
                <h4 className="text-xs font-bold text-parchment-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-parchment-400"></span>
                    Notes & Etymology
                </h4>
                {isEditing ? (
                    <textarea
                        value={formData.etymology || ''}
                        onChange={(e) => handleChange('etymology', e.target.value)}
                        placeholder="Add etymology notes..."
                        className="w-full bg-transparent border border-parchment-300 focus:border-parchment-500 rounded p-2 text-sm text-parchment-700 outline-none resize-y min-h-[60px]"
                    />
                ) : (
                    <p className="text-sm text-parchment-700 leading-relaxed italic">
                        {token.etymology}
                    </p>
                )}
            </div>
        )}

        {/* AI Grounding Sources Section */}
        {!isEditing && token.sources && token.sources.length > 0 && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles size={10} />
                    AI Verified Sources
                </h4>
                <div className="space-y-2">
                    {token.sources.map((source, idx) => (
                        <a 
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-indigo-700 hover:text-indigo-900 hover:underline truncate"
                        >
                            <LinkIcon size={12} />
                            {source.title}
                        </a>
                    ))}
                </div>
            </div>
        )}

        {!isEditing && (
            <div className="mt-8 pt-6 border-t border-parchment-200">
            <h4 className="text-xs font-bold text-parchment-500 uppercase tracking-widest mb-4">
                External Resources
            </h4>
            <div className="flex flex-col gap-3">
                <a 
                href={bosworthTollerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-parchment-100 hover:bg-white border border-parchment-200 hover:border-parchment-400 transition-all group"
                >
                <div className="flex items-center gap-3">
                    <div className="bg-parchment-200 p-1.5 rounded-md group-hover:bg-parchment-300 transition-colors">
                    <Library size={18} className="text-parchment-700"/>
                    </div>
                    <div className="flex flex-col">
                    <span className="font-serif font-semibold text-parchment-900 leading-tight">Bosworth-Toller</span>
                    <span className="text-[10px] text-parchment-600 uppercase tracking-wider">Anglo-Saxon Dictionary</span>
                    </div>
                </div>
                <ExternalLink size={14} className="text-parchment-400 group-hover:text-parchment-600"/>
                </a>
                
                <a 
                href={wiktionaryUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-parchment-100 hover:bg-white border border-parchment-200 hover:border-parchment-400 transition-all group"
                >
                <div className="flex items-center gap-3">
                    <div className="bg-parchment-200 p-1.5 rounded-md group-hover:bg-parchment-300 transition-colors">
                    <BookMarked size={18} className="text-parchment-700"/>
                    </div>
                    <div className="flex flex-col">
                    <span className="font-serif font-semibold text-parchment-900 leading-tight">Wiktionary</span>
                    <span className="text-[10px] text-parchment-600 uppercase tracking-wider">Free Dictionary</span>
                    </div>
                </div>
                <ExternalLink size={14} className="text-parchment-400 group-hover:text-parchment-600"/>
                </a>
            </div>
            </div>
        )}

      </div>
    </div>
  );
};
