export type Language = 'en' | 'zh';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export const LEVEL_TOTALS: Record<ProficiencyLevel, number> = {
  'Beginner': 500,
  'Intermediate': 1500,
  'Advanced': 3000
};

export interface VocabWord {
  word: string;
  pronunciation: string;
  definition_en: string;
  definition_zh: string;
  example_sentence: string;
  translation_zh: string;
}

export interface PlacementQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserSettings {
  level: ProficiencyLevel;
  dailyTarget: number;
  hasCompletedPlacement: boolean;
  nickname: string;
  theme: 'light' | 'dark';
  learnedWords: string[]; // List of words learned to prevent duplicates and track progress
}

export interface StoryData {
  title: string;
  english: string;
  chinese: string;
  keywords: { word: string; definition: string }[];
}

export type AppView = 'onboarding' | 'dashboard' | 'placement' | 'placement_result' | 'learning' | 'story' | 'summary';
export type Tab = 'learning' | 'profile';

export interface LearningSessionData {
  words: VocabWord[];
  currentIndex: number;
  completed: boolean;
}