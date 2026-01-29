import React from 'react';
import { BookOpen, User } from 'lucide-react';
import { Tab, Language } from '../types';
import { translations } from '../i18n';

interface Props {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  lang: Language;
}

export const BottomNav: React.FC<Props> = ({ activeTab, setActiveTab, lang }) => {
  const t = translations[lang];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('learning')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'learning' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen size={24} strokeWidth={activeTab === 'learning' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t.tabLearning}</span>
        </button>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{t.tabProfile}</span>
        </button>
      </div>
    </div>
  );
};
