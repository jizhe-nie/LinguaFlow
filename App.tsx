import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronRight, Volume2, Sparkles, Brain, Award, ArrowRight, Loader2, Play, X, AlertCircle, Languages, BookOpen } from 'lucide-react';
import { Language, ProficiencyLevel, UserSettings, AppView, VocabWord, Tab, PlacementQuestion, StoryData } from './types';
import { translations } from './i18n';
import { generateVocabulary, generateStory, generatePlacementTest, generateSpeech } from './services/geminiService';
import { LanguageToggle } from './components/LanguageToggle';
import { ProgressBar } from './components/ProgressBar';
import { BottomNav } from './components/BottomNav';
import { Profile } from './components/Profile';

export default function App() {
  // Global State
  const [activeTab, setActiveTab] = useState<Tab>('learning');
  const [lang, setLang] = useState<Language>('zh'); 
  const [settings, setSettings] = useState<UserSettings>({
    level: 'Beginner',
    dailyTarget: 5,
    hasCompletedPlacement: false, // Will be true after first completion
    nickname: 'Student',
    theme: 'light',
    learnedWords: [], // Store learned words locally
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Audio State & Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const storySourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Persistence: Load from LocalStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('linguaFlowSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Persistence: Save to LocalStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('linguaFlowSettings', JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);
  
  // Learning Flow State
  const [view, setView] = useState<AppView>('onboarding'); // Default, will change based on effect below
  
  // Effect to determine initial view
  useEffect(() => {
    if (isInitialized) {
      if (!settings.hasCompletedPlacement) {
        setView('onboarding');
      } else {
        setView('dashboard');
      }
    }
  }, [isInitialized, settings.hasCompletedPlacement]);

  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Story State
  const [generatedStory, setGeneratedStory] = useState<StoryData | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  
  // Placement Test State
  const [placementQuestions, setPlacementQuestions] = useState<PlacementQuestion[]>([]);
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<number[]>([]); // Store user answers
  const [tempRecommendedLevel, setTempRecommendedLevel] = useState<ProficiencyLevel>('Beginner'); // Temp store for result view
  const [tempDailyTarget, setTempDailyTarget] = useState(5); // Temp store for goal setting

  // Localization helper
  const t = translations[lang];

  // Handlers
  const handleStartPlacement = async () => {
    setLoading(true);
    setLoadingMessage(t.loadingVocab);
    // Ensure we are on the learning tab if started from Profile
    setActiveTab('learning');
    
    try {
      const questions = await generatePlacementTest();
      setPlacementQuestions(questions);
      setPlacementIndex(0);
      setPlacementAnswers([]);
      setView('placement');
    } catch (error) {
      console.error(error);
      alert("Error loading placement test. Skipping to manual selection.");
      // If error, and never done before, go to onboarding. If done before, back to dashboard.
      setView(settings.hasCompletedPlacement ? 'dashboard' : 'onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementAnswer = (index: number) => {
    // Save answer
    const newAnswers = [...placementAnswers, index];
    setPlacementAnswers(newAnswers);
    
    if (placementIndex < placementQuestions.length - 1) {
      setPlacementIndex(i => i + 1);
    } else {
      // Calculate Score
      let score = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans === placementQuestions[idx].correctIndex) score++;
      });

      // Determine Level (Simple logic for 10 questions)
      // 0-3: Beginner, 4-7: Intermediate, 8-10: Advanced
      let recommended: ProficiencyLevel = 'Beginner';
      if (score >= 4) recommended = 'Intermediate';
      if (score >= 8) recommended = 'Advanced';
      
      setTempRecommendedLevel(recommended);
      setTempDailyTarget(settings.dailyTarget); // Default to current or 5
      setView('placement_result');
    }
  };

  const completePlacementSetup = () => {
    setSettings(prev => ({ 
      ...prev, 
      level: tempRecommendedLevel, 
      dailyTarget: tempDailyTarget,
      hasCompletedPlacement: true 
    }));
    setView('dashboard');
  };

  const startDailySession = async () => {
    setLoading(true);
    setLoadingMessage(t.loadingVocab);
    try {
      const words = await generateVocabulary(settings.level, settings.dailyTarget);
      // Filter out words that might have been learned (simple duplication check)
      const newWords = words.filter(w => !settings.learnedWords.includes(w.word));
      
      // If the filter removes too many, we use what we have
      setVocabList(words);
      setCurrentWordIndex(0);
      setIsFlipped(false);
      setView('learning');
    } catch (e) {
      console.error(e);
      alert("Failed to generate vocabulary. Please check API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < vocabList.length - 1) {
      setIsFlipped(false);
      setCurrentWordIndex(prev => prev + 1);
    } else {
      finishLearningSession();
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setIsFlipped(false);
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const finishLearningSession = async () => {
    setLoading(true);
    setLoadingMessage(t.generatingStory);
    try {
      // Update stats and learned words
      setSettings(prev => {
        const newLearned = [...prev.learnedWords];
        vocabList.forEach(w => {
           if (!newLearned.includes(w.word)) newLearned.push(w.word);
        });
        return {
          ...prev,
          learnedWords: newLearned,
          totalLearned: newLearned.length // Update total count based on unique list
        };
      });

      const storyData = await generateStory(vocabList.map(v => v.word), settings.level);
      setGeneratedStory(storyData);
      setShowTranslation(false);
      setView('story');
    } catch (e) {
      console.error(e);
      // Fallback for error state
      setGeneratedStory(null); 
      alert("Could not generate story. Please try again later.");
      setView('dashboard');
    } finally {
      setLoading(false);
    }
  };

  // --- AUDIO LOGIC ---
  const stopAudio = () => {
    if (storySourceRef.current) {
      storySourceRef.current.stop();
      storySourceRef.current = null;
    }
    setIsPlayingStory(false);
  };

  const playAudio = async (text: string, isStory = false) => {
    if (audioLoading) return;
    
    // If playing story, toggle off
    if (isStory && isPlayingStory) {
      stopAudio();
      return;
    }
    
    // Stop any current playing story if new audio requested
    if (isPlayingStory) {
      stopAudio();
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (audioCache.current.has(text)) {
      playBuffer(audioCache.current.get(text)!, ctx, isStory);
      return;
    }

    setAudioLoading(text);
    try {
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error("Failed to generate audio");

      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, pcm16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      audioCache.current.set(text, buffer);
      playBuffer(buffer, ctx, isStory);
    } catch (e) {
      console.error("Audio playback error:", e);
      alert("Could not play audio. Please check connection.");
    } finally {
      setAudioLoading(null);
    }
  };

  const playBuffer = (buffer: AudioBuffer, ctx: AudioContext, isStory: boolean) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (isStory) setIsPlayingStory(false);
    };
    source.start(0);
    
    if (isStory) {
      storySourceRef.current = source;
      setIsPlayingStory(true);
    }
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50 dark:bg-gray-900 p-6 text-center">
      <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 animate-pulse">{loadingMessage}</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xs mx-auto">Powered by Gemini AI</p>
    </div>
  );

  // --- LEARNING TAB CONTENT ---
  const renderLearningTab = () => {
    if (loading) return renderLoading();

    // VIEW: DASHBOARD (Main Home for Returning Users)
    if (view === 'dashboard') {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans pb-24">
                <LanguageToggle lang={lang} setLang={setLang} />
                <div className="max-w-md mx-auto px-6 py-12 flex flex-col min-h-screen">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.welcome} {settings.nickname}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.subtitle}</p>
                        </div>

                        {/* Daily Goal Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-8 relative overflow-hidden">
                           <div className="relative z-10">
                              <h2 className="text-indigo-100 font-medium mb-1 uppercase tracking-wider text-xs">{t.dashboardTitle}</h2>
                              <p className="text-2xl font-bold mb-6">{t.dashboardSubtitle}</p>
                              
                              <div className="flex items-center gap-4 mb-6">
                                  {/* Interactive Daily Target */}
                                  <div className="bg-white/20 p-2 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
                                      <button 
                                        onClick={() => setSettings(s => ({...s, dailyTarget: Math.max(3, s.dailyTarget - 1)}))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold active:scale-95"
                                      >
                                        -
                                      </button>
                                      <div className="text-center min-w-[2.5rem]">
                                        <span className="block text-2xl font-bold leading-none">{settings.dailyTarget}</span>
                                        <span className="text-[10px] text-indigo-100 uppercase tracking-wider">{t.words}</span>
                                      </div>
                                      <button 
                                        onClick={() => setSettings(s => ({...s, dailyTarget: Math.min(20, s.dailyTarget + 1)}))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold active:scale-95"
                                      >
                                        +
                                      </button>
                                  </div>
                                  
                                  <div className="h-10 w-[1px] bg-white/20"></div>
                                  <div>
                                      <span className="text-sm text-indigo-100 block">{t.currentLevel}</span>
                                      <span className="font-semibold">{settings.level}</span>
                                  </div>
                              </div>

                              <button 
                                onClick={startDailySession}
                                className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all"
                              >
                                <Play size={20} fill="currentColor" />
                                {t.startLearning}
                              </button>
                           </div>
                           
                           {/* Background Decoration */}
                           <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <Award className="text-orange-500 mb-2" size={24} />
                               <span className="block text-2xl font-bold">{settings.learnedWords.length}</span>
                               <span className="text-xs text-gray-500">{t.totalLearned}</span>
                           </div>
                           <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <Brain className="text-blue-500 mb-2" size={24} />
                               <span className="block text-2xl font-bold">{settings.dailyTarget}</span>
                               <span className="text-xs text-gray-500">{t.dailyGoal}</span>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW: ONBOARDING (First Time Only)
    if (view === 'onboarding') {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans pb-24">
          <LanguageToggle lang={lang} setLang={setLang} />
          
          <div className="max-w-md mx-auto px-6 py-12 flex flex-col min-h-screen">
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                  <Brain size={40} />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">LinguaFlow</h1>
                <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
              </div>

               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl mb-8 border border-indigo-100 dark:border-indigo-900">
                 <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">{t.placementTitle}</h3>
                 <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-4">{t.placementSubtitle}</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={handleStartPlacement}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition"
                    >
                      {t.takePlacement}
                    </button>
                 </div>
               </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.selectLevel}</label>
                  <p className="text-xs text-gray-400 mb-3">{t.skipPlacement}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {(['Beginner', 'Intermediate', 'Advanced'] as ProficiencyLevel[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setSettings(s => ({...s, level: l}))}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          settings.level === l 
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 dark:border-indigo-500' 
                            : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${settings.level === l ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-400'}`}>
                            {l === 'Beginner' ? t.beginner : l === 'Intermediate' ? t.intermediate : t.advanced}
                          </span>
                          {settings.level === l && <Check className="text-indigo-600 dark:text-indigo-400" size={20} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.dailyGoal}</label>
                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <button 
                      onClick={() => setSettings(s => ({...s, dailyTarget: Math.max(3, s.dailyTarget - 1)}))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-lg text-gray-800 dark:text-white">{settings.dailyTarget}</span>
                    <button 
                      onClick={() => setSettings(s => ({...s, dailyTarget: Math.min(20, s.dailyTarget + 1)}))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                   setSettings(s => ({...s, hasCompletedPlacement: true}));
                   startDailySession();
                }}
                className="w-full bg-gray-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{t.startLearning}</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // VIEW: PLACEMENT TEST
    if (view === 'placement') {
      const question = placementQuestions[placementIndex];
      return (
         <div className="min-h-screen bg-white dark:bg-gray-950 p-6 max-w-md mx-auto flex flex-col pb-24 text-gray-900 dark:text-gray-100">
           <div className="mb-8 pt-8">
             <ProgressBar current={placementIndex} total={placementQuestions.length} />
             <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">Question {placementIndex + 1} of {placementQuestions.length}</p>
           </div>
           
           <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold mb-8 leading-relaxed">{question.question}</h2>
              <div className="space-y-3">
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePlacementAnswer(idx)}
                    className="w-full p-4 text-left rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors font-medium text-gray-700 dark:text-gray-300"
                  >
                    {opt}
                  </button>
                ))}
              </div>
           </div>
         </div>
      );
    }

    // VIEW: PLACEMENT RESULT
    if (view === 'placement_result') {
      const correctCount = placementAnswers.filter((a, i) => a === placementQuestions[i].correctIndex).length;
      
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-32">
          <div className="p-6 pt-12 max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">{t.testComplete}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">{t.yourScore}: <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">{correctCount}/{placementQuestions.length}</span></p>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl mb-8 border border-indigo-100 dark:border-indigo-900 text-center">
               <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2">{t.recommendedLevel}</h3>
               <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{tempRecommendedLevel}</div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Brain className="text-indigo-500" size={20} />
                {t.reviewAnswers}
              </h3>
              <div className="space-y-6">
                {placementQuestions.map((q, i) => {
                  const userAnswer = placementAnswers[i];
                  const isCorrect = userAnswer === q.correctIndex;
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900' : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900'}`}>
                       <p className="font-medium mb-3 text-sm">{i + 1}. {q.question}</p>
                       <div className="space-y-2 mb-3">
                         {q.options.map((opt, optIdx) => {
                           const isSelected = userAnswer === optIdx;
                           const isTheCorrectAnswer = q.correctIndex === optIdx;
                           
                           let styles = "text-gray-500 dark:text-gray-400";
                           if (isTheCorrectAnswer) styles = "text-green-700 dark:text-green-400 font-bold";
                           else if (isSelected && !isCorrect) styles = "text-red-600 dark:text-red-400 line-through";
                           
                           return (
                             <div key={optIdx} className={`text-xs flex items-center gap-2 ${styles}`}>
                                {isTheCorrectAnswer && <Check size={12} />}
                                {isSelected && !isCorrect && <X size={12} />}
                                {opt}
                             </div>
                           )
                         })}
                       </div>
                       <div className="flex gap-2 items-start text-xs text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span>{t.explanation}: {q.explanation}</span>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">{t.setupPlan}</h3>
               
               <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.goalInstruction}</label>
                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <button 
                      onClick={() => setTempDailyTarget(Math.max(3, tempDailyTarget - 1))}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm active:scale-95"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-2xl text-gray-800 dark:text-white">{tempDailyTarget}</span>
                    <button 
                      onClick={() => setTempDailyTarget(Math.min(20, tempDailyTarget + 1))}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm active:scale-95"
                    >
                      +
                    </button>
                  </div>
               </div>

               <button
                onClick={completePlacementSetup}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                {t.completeSetup}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // VIEW: LEARNING
    if (view === 'learning') {
      const word = vocabList[currentWordIndex];
      const isWordLoading = audioLoading === word.word;
      const isExampleLoading = audioLoading === word.example_sentence;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pb-24">
          <LanguageToggle lang={lang} setLang={setLang} />
          
          <div className="bg-white dark:bg-gray-900 px-6 pt-12 pb-4 shadow-sm z-10 transition-colors">
            <div className="max-w-md mx-auto">
               <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Daily Goal</span>
                  <span>{currentWordIndex + 1} / {vocabList.length}</span>
               </div>
               <ProgressBar current={currentWordIndex} total={vocabList.length} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
            <div 
              className="perspective-1000 w-full aspect-[4/5] relative cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`w-full h-full relative preserve-3d transition-all duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 flex flex-col items-center justify-center p-8 border border-white dark:border-gray-800">
                  <span className="text-sm font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full mb-8">New Word</span>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">{word.word}</h2>
                  <p className="text-xl text-gray-400 font-mono mb-8">/{word.pronunciation}/</p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); playAudio(word.word); }}
                    disabled={!!audioLoading}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        isWordLoading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                    } text-white`}
                  >
                    {isWordLoading ? <Loader2 size={32} className="animate-spin" /> : <Volume2 size={32} />}
                  </button>
                  
                  <p className="absolute bottom-8 text-gray-400 text-sm flex items-center gap-2 animate-bounce">
                    <span>Tap to flip</span>
                  </p>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-900 dark:bg-gray-900 dark:border dark:border-gray-700 rounded-3xl shadow-xl flex flex-col p-8 text-white overflow-y-auto custom-scrollbar">
                  <div className="flex-1 flex flex-col justify-center">
                    
                    <div className="text-center mb-6 border-b border-indigo-800 dark:border-gray-700 pb-4">
                       <h2 className="text-3xl font-bold mb-1">{word.word}</h2>
                       <div className="flex items-center justify-center gap-2 text-indigo-300 dark:text-indigo-400">
                          <span className="font-mono text-sm">/{word.pronunciation}/</span>
                          <button 
                             onClick={(e) => { e.stopPropagation(); playAudio(word.word); }}
                             disabled={!!audioLoading}
                             className="p-1 hover:text-white transition-colors"
                          >
                             {isWordLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                          </button>
                       </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-indigo-200 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Definition</h3>
                      <p className="text-lg font-medium leading-relaxed">{lang === 'en' ? word.definition_en : word.definition_zh}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-indigo-200 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Translation</h3>
                      <p className="text-2xl font-bold">{word.translation_zh}</p>
                    </div>

                    <div>
                      <h3 className="text-indigo-200 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Example</h3>
                      <p className="text-lg text-indigo-100 dark:text-gray-300 italic">"{word.example_sentence}"</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); playAudio(word.example_sentence); }}
                        disabled={!!audioLoading}
                        className="mt-2 text-indigo-300 dark:text-indigo-400 hover:text-white flex items-center gap-2 text-sm"
                      >
                         {isExampleLoading ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />} 
                         {isExampleLoading ? "Loading..." : "Listen"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 pb-8 border-t border-gray-100 dark:border-gray-800 transition-colors">
             <div className="max-w-md mx-auto flex gap-4">
               <button 
                  onClick={handlePreviousWord}
                  disabled={currentWordIndex === 0}
                  className={`flex-1 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2
                    ${currentWordIndex === 0 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white active:scale-95'
                    }`}
                >
                  <ChevronRight size={20} className="rotate-180" />
                  {t.prev}
                </button>

               <button 
                  onClick={handleNextWord}
                  className="flex-[2] bg-gray-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 dark:hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                  {currentWordIndex < vocabList.length - 1 ? t.next : t.finish}
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      );
    }

    // VIEW: STORY
    if (view === 'story' && generatedStory) {
      const cleanTextForAudio = generatedStory.english.replace(/\*\*(.*?)\*\*/g, '$1');

      return (
        <div className="min-h-screen bg-[#fffbf0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-serif pb-24">
           <LanguageToggle lang={lang} setLang={setLang} />
           
           <div className="max-w-lg mx-auto min-h-screen flex flex-col">
              <div className="p-8 pt-16 flex-1">
                <div className="flex items-center gap-3 mb-6 text-amber-700 dark:text-amber-500">
                  <Sparkles size={24} />
                  <span className="font-sans font-bold uppercase tracking-widest text-sm">{t.storyTime}</span>
                </div>
                
                <h1 className="text-3xl font-bold mb-2 font-sans text-gray-900 dark:text-white">{generatedStory.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-6">{t.storySubtitle}</p>
                
                {/* Audio Controls */}
                <button
                  onClick={() => playAudio(cleanTextForAudio, true)}
                  disabled={!!audioLoading && !isPlayingStory}
                  className="mb-6 flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-full font-sans font-bold text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  {isPlayingStory ? <div className="animate-pulse w-4 h-4 rounded-sm bg-current"></div> : <Volume2 size={16} />}
                  {isPlayingStory ? t.stopReading : t.readAloud}
                  {audioLoading === cleanTextForAudio && <Loader2 size={14} className="animate-spin ml-1" />}
                </button>

                {/* English Text */}
                <div className="prose prose-lg dark:prose-invert prose-p:leading-loose prose-p:text-gray-800 dark:prose-p:text-gray-300 mb-8">
                  {generatedStory.english.split('\n').map((paragraph, idx) => (
                    <p key={idx} dangerouslySetInnerHTML={{
                      __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded mx-0.5 font-bold text-gray-900 dark:text-yellow-200">$1</span>')
                    }} />
                  ))}
                </div>

                {/* Translation Toggle */}
                <div className="mb-8 font-sans">
                  <button 
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                  >
                    <Languages size={16} />
                    {showTranslation ? t.hideTranslation : t.showTranslation}
                  </button>
                  
                  {showTranslation && (
                    <div className="mt-4 p-6 bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-top-4 duration-300">
                      {generatedStory.chinese}
                    </div>
                  )}
                </div>
                
                {/* Glossary / Keywords */}
                <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-100 dark:border-gray-800 font-sans">
                   <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <BookOpen size={20} className="text-amber-500" />
                     {t.keywords}
                   </h3>
                   <div className="space-y-3">
                     {generatedStory.keywords.map((item, i) => (
                       <div key={i} className="flex justify-between items-baseline border-b last:border-0 border-gray-100 dark:border-gray-800 pb-2 last:pb-0">
                         <span className="font-bold text-gray-800 dark:text-gray-200">{item.word}</span>
                         <span className="text-sm text-gray-500 dark:text-gray-400">{item.definition}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="p-6 pb-8 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky bottom-[60px] border-t border-amber-100/50 dark:border-gray-800">
                 <button 
                    onClick={() => {
                      stopAudio();
                      setView('dashboard');
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.backToHome}
                  </button>
              </div>
           </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
        {activeTab === 'learning' ? renderLearningTab() : <Profile settings={settings} setSettings={setSettings} lang={lang} onRetakePlacement={handleStartPlacement} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />
    </>
  );
}