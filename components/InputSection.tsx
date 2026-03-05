import React, { useState, useRef } from 'react';
import { Feather, BookOpen, Keyboard, Upload } from 'lucide-react';
import { GlossToken } from '../types';

interface InputSectionProps {
  onSubmit: (text: string) => void;
  onQuickLoad: (text: string) => void;
  onImport: (tokens: GlossToken[]) => void;
  isLoading: boolean;
}

const SAMPLE_TEXT = `Hwæt! Wé Gárdena in géardagum
þéodcyninga þrym gefrúnon
hú þá æþelingas ellen fremedon.

Oft Scyld Scéfing sceaþena þréatum
monegum mægþum meodosetla oftéah.`;

const SPECIAL_CHARS = [
  // Requested Consonants
  { char: 'æ', label: 'æ' },
  { char: 'ð', label: 'ð' },
  { char: 'þ', label: 'þ' },
  { char: 'ƿ', label: 'ƿ' },
  // Divider
  { char: '|', label: '|', isDivider: true },
  // Common Macrons (Vowels)
  { char: 'ā', label: 'ā' },
  { char: 'ǣ', label: 'ǣ' },
  { char: 'ē', label: 'ē' },
  { char: 'ī', label: 'ī' },
  { char: 'ō', label: 'ō' },
  { char: 'ū', label: 'ū' },
  { char: 'ȳ', label: 'ȳ' },
  // Divider
  { char: '|', label: '|', isDivider: true },
  // Uppercase Consonants
  { char: 'Æ', label: 'Æ' },
  { char: 'Ð', label: 'Ð' },
  { char: 'Þ', label: 'Þ' },
  { char: 'Ƿ', label: 'Ƿ' },
];

export const InputSection: React.FC<InputSectionProps> = ({ onSubmit, onQuickLoad, onImport, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  const handleUseSample = () => {
    setText(SAMPLE_TEXT);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Basic validation to ensure it looks like GlossToken[]
          const isValid = json.length === 0 || (json[0].original !== undefined && json[0].lemma !== undefined);
          if (isValid) {
            onImport(json as GlossToken[]);
          } else {
            alert("Invalid file format: The JSON does not contain recognized gloss data.");
          }
        } else {
          alert("Invalid file format: Expected an array of tokens.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Failed to parse the file. Please ensure it is a valid JSON file.");
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const insertChar = (char: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText(prev => prev + char);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = text;

    const newVal = currentVal.substring(0, start) + char + currentVal.substring(end);
    
    setText(newVal);

    // Restore focus and move cursor after the inserted character
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-parchment-300 shadow-xl overflow-hidden">
        <div className="bg-parchment-100/80 border-b border-parchment-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-serif font-semibold text-parchment-900 flex items-center gap-2">
            <Feather size={18} className="text-parchment-600" />
            Input Text
          </h2>
          <button 
            onClick={handleUseSample}
            type="button"
            className="text-xs font-medium text-parchment-600 hover:text-parchment-800 bg-parchment-200/50 hover:bg-parchment-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={14} />
            Use Beowulf Sample
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Special Character Toolbar */}
          <div className="mb-3 flex items-center gap-2 flex-wrap bg-parchment-100/50 p-2 rounded-lg border border-parchment-200/50">
             <div className="mr-2 text-parchment-400">
                <Keyboard size={16} />
             </div>
             {SPECIAL_CHARS.map((item, idx) => {
                if (item.isDivider) {
                    return <div key={idx} className="w-px h-6 bg-parchment-300 mx-1"></div>;
                }
                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => insertChar(item.char)}
                        className="
                           min-w-[32px] h-8 flex items-center justify-center rounded 
                           bg-parchment-50 hover:bg-white active:bg-parchment-200
                           text-parchment-900 font-serif text-lg leading-none
                           border border-parchment-300 shadow-sm
                           transition-all active:scale-95 hover:shadow-md hover:-translate-y-0.5
                        "
                        title={`Insert ${item.char}`}
                    >
                        {item.char}
                    </button>
                );
             })}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your Old English text here (e.g., from Beowulf, The Wanderer, etc.)..."
            className="w-full h-48 bg-parchment-50 border-2 border-parchment-200 rounded-lg p-4 font-serif text-xl text-parchment-900 placeholder:text-parchment-400 focus:border-parchment-500 focus:ring-0 focus:outline-none resize-none transition-all"
            spellCheck={false}
          />
          
          <div className="mt-4 flex justify-between items-center">
            {/* Import Button */}
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                hidden 
              />
              <button
                type="button"
                onClick={handleFileClick}
                disabled={isLoading}
                className="text-sm font-medium text-parchment-600 hover:text-parchment-900 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-200/50 transition-colors"
              >
                <Upload size={16} />
                Load Analysis
              </button>
            </div>

            {/* Right-side buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (text.trim()) onQuickLoad(text); }}
                disabled={!text.trim() || isLoading}
                className={`
                  px-5 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2
                  transition-all duration-300 transform active:scale-95
                  ${!text.trim() || isLoading
                    ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed opacity-70'
                    : 'bg-parchment-200 text-parchment-800 hover:bg-parchment-300 hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                Gloss Words On Demand
              </button>

              <button
                type="submit"
                disabled={!text.trim() || isLoading}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-white shadow-md flex items-center gap-2
                  transition-all duration-300 transform active:scale-95
                  ${!text.trim() || isLoading
                    ? 'bg-parchment-400 cursor-not-allowed opacity-70'
                    : 'bg-parchment-700 hover:bg-parchment-800 hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Analysing...
                  </>
                ) : (
                  <>
                    <span>Gloss Entire Text</span>
                    <Feather size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <p className="text-center mt-6 text-parchment-600 text-sm max-w-lg mx-auto italic">
        "Swa scribende gesceap hweorfað gleomen gumena geond grund fela..."
        <br/>
        <span className="text-parchment-500 not-italic text-xs mt-1 block">(Use this tool to discover the meaning of ancient words.)</span>
      </p>
    </div>
  );
};