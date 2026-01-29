import React, { useState } from 'react';
import { User, Moon, Sun, BarChart2, Edit2, Check, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { Language, UserSettings, ProficiencyLevel, LEVEL_TOTALS } from '../types';
import { translations } from '../i18n';
import { ProgressBar } from './ProgressBar';

interface Props {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  lang: Language;
  onRetakePlacement: () => void;
}

export const Profile: React.FC<Props> = ({ settings, setSettings, lang, onRetakePlacement }) => {
  const t = translations[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(settings.nickname);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const handleSaveName = () => {
    setSettings(prev => ({ ...prev, nickname: tempName }));
    setIsEditing(false);
  };

  const handleLevelChange = (newLevel: ProficiencyLevel) => {
    if (confirm(t.resetWarning)) {
      setSettings(prev => ({ ...prev, level: newLevel }));
      setShowLevelSelect(false);
    }
  };

  const totalWordsInLevel = LEVEL_TOTALS[settings.level];
  const learnedCount = settings.learnedWords.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-8 pb-12 rounded-b-[2.5rem] shadow-sm mb-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mb-4">
            <span className="text-3xl font-bold">{settings.nickname.charAt(0).toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-1.5 bg-indigo-600 text-white rounded-full">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{settings.nickname}</h1>
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-600">
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {settings.level}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-6 max-w-md mx-auto">
        {/* Stats Card */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t.stats}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                <BarChart2 size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                   <p className="text-sm text-gray-500 dark:text-gray-400">{t.totalLearned}</p>
                   <p className="text-xs text-indigo-500 font-medium">{learnedCount} / {totalWordsInLevel}</p>
                </div>
                <h3 className="text-2xl font-bold">{learnedCount} <span className="text-sm font-normal text-gray-400">{t.words}</span></h3>
              </div>
            </div>
            <ProgressBar current={learnedCount} total={totalWordsInLevel} />
            <p className="text-xs text-gray-400 mt-2 text-center">{((learnedCount / totalWordsInLevel) * 100).toFixed(1)}% of {settings.level} curriculum completed</p>
          </div>
        </section>

        {/* Level & Curriculum Settings */}
        <section>
           <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t.levelSettings}</h2>
           <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 space-y-1">
              {/* Level Selector Toggle */}
              <div>
                <button 
                  onClick={() => setShowLevelSelect(!showLevelSelect)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <span className="block font-medium text-gray-700 dark:text-gray-200">{t.changeLevel}</span>
                        <span className="text-xs text-gray-500">{settings.level}</span>
                      </div>
                   </div>
                   <ChevronDown size={16} className={`text-gray-400 transition-transform ${showLevelSelect ? 'rotate-180' : ''}`} />
                </button>

                {showLevelSelect && (
                  <div className="px-4 pb-4 grid gap-2">
                    {(['Beginner', 'Intermediate', 'Advanced'] as ProficiencyLevel[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => handleLevelChange(l)}
                        className={`p-3 rounded-lg text-sm text-left font-medium transition-colors ${
                          settings.level === l 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {l === 'Beginner' ? t.beginner : l === 'Intermediate' ? t.intermediate : t.advanced}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Retake Placement */}
              <button 
                onClick={onRetakePlacement}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <RefreshCw size={20} />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{t.retakeTest}</span>
                </div>
              </button>
           </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t.appearance}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{t.theme}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {settings.theme === 'dark' ? t.darkMode : t.lightMode}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};