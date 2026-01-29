import React from 'react';
import { Language } from '../types';
import { Globe } from 'lucide-react';

interface Props {
  lang: Language;
  setLang: (l: Language) => void;
}

export const LanguageToggle: React.FC<Props> = ({ lang, setLang }) => {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 active:scale-95 transition-transform"
    >
      <Globe size={16} />
      <span>{lang === 'en' ? 'EN' : '中文'}</span>
    </button>
  );
};
