# LinguaFlow - AI English Tutor / AI 英语私教

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-blue)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-3.0-cyan)

**LinguaFlow** is an Android-styled progressive web application (PWA) designed to revolutionize language learning. By leveraging **Google Gemini AI**, it provides a hyper-personalized English learning experience, featuring adaptive placement tests, context-based story generation, and realistic AI voice synthesis.

**LinguaFlow** 是一款类 Android 风格的渐进式 Web 应用 (PWA)，旨在革新语言学习体验。通过利用 **Google Gemini AI**，它提供超个性化的英语学习体验，功能涵盖自适应分级测试、基于语境的故事生成以及逼真的 AI 语音合成。

---

## 📱 Screenshots / 运行界面

> *Please add your screenshots to an `assets` folder in your project root.*
> *请将您的实际运行截图放入项目根目录下的 `assets` 文件夹中。*

| **Dashboard (每日看板)** | **Flashcard (单词卡片)** |
|:---:|:---:|
| <img src="assets/dashboard.png" alt="Dashboard" width="300"/> | <img src="assets/flashcard.png" alt="Flashcard" width="300"/> |
| *Interactive goals & progress tracking* | *Flip card with pronunciation & examples* |

| **AI Story (AI 故事生成)** | **Placement Test (分级测试)** |
|:---:|:---:|
| <img src="assets/story.png" alt="Story Mode" width="300"/> | <img src="assets/placement.png" alt="Placement Test" width="300"/> |
| *Contextual story with TTS & translation* | *Adaptive testing with explanations* |

---

## ✨ Key Features / 核心功能

### 1. 🧠 Intelligent Placement Test (智能分级测试)
*   **Adaptive Difficulty:** Questions range from Beginner to Advanced generated in real-time by Gemini 3 Flash.
*   **Instant Feedback:** Detailed explanations for every answer.
*   **Level Recommendation:** Automatically suggests the best difficulty level based on your score.
*   **自适应难度：** 由 Gemini 3 Flash 实时生成从初级到高级的试题。
*   **即时反馈：** 每个答案都有详细的解析。
*   **等级推荐：** 根据得分自动建议最佳学习难度。

### 2. 📚 Contextual Vocabulary Learning (语境化词汇学习)
*   **Smart Curation:** Daily vocabulary words generated based on your CEFR level.
*   **Interactive Cards:** 3D flip animations showing definitions (EN/CN), IPA pronunciation, and example sentences.
*   **Native TTS:** High-quality AI pronunciation using `gemini-2.5-flash-preview-tts`.
*   **智能精选：** 根据您的 CEFR 等级每日生成词汇。
*   **交互式卡片：** 3D 翻转动画，展示中英释义、音标和例句。
*   **原生 TTS：** 使用 Gemini 2.5 Flash TTS 提供高质量的 AI 发音。

### 3. 📖 AI Story Generation & Comprehension (AI 故事生成与阅读)
*   **Reinforcement:** Automatically generates a unique story containing *all* the words you learned that day.
*   **Full Audio Experience:** **(New)** Listen to the entire generated story read aloud by AI.
*   **Bilingual Support:** **(New)** One-click toggle to show/hide Chinese translations.
*   **Glossary Notes:** **(New)** Auto-generated vocabulary notes for difficult terms in the story.
*   **知识巩固：** 自动生成包含当日*所有*所学单词的独特故事。
*   **全语音体验：** **(新增)** AI 全文朗读生成的故事。
*   **双语支持：** **(新增)** 一键显示/隐藏中文译文。
*   **生词注释：** **(新增)** 自动为故事中的难点词汇生成注释。

### 4. ⚙️ Personalization & Progress (个性化与进度)
*   **Interactive Goals:** Adjust your daily word target directly from the dashboard.
*   **Progress Tracking:** Visual bars showing your curriculum progress and total learned words.
*   **Theme Support:** Fully supported Dark Mode and Light Mode.
*   **交互式目标：** 直接在主页调整每日单词目标。
*   **进度追踪：** 可视化进度条展示课程进度和累计学习单词。
*   **主题支持：** 完美支持深色模式和浅色模式。

---

## 🛠 Tech Stack / 技术栈

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (Dark mode enabled)
*   **AI Integration:** `@google/genai` SDK
*   **Models Used:**
    *   `gemini-3-flash-preview` (Logic, Text, Reasoning)
    *   `gemini-2.5-flash-preview-tts` (Text-to-Speech)
*   **Icons:** Lucide React
*   **Build Tool:** Vite

---

## 🚀 Getting Started / 快速开始

### Prerequisites / 前置要求
*   Node.js (v18 or higher)
*   A Google Cloud Project with Gemini API enabled.
*   An API Key.

### Installation / 安装步骤

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/linguaflow.git
    cd linguaflow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Key:**
    Create a `.env` file in the root directory and add your key:
    ```env
    # Ensure your bundler injects this into process.env
    API_KEY=your_google_genai_api_key
    ```

4.  **Run the application:**
    ```bash
    npm start
    # or
    npm run dev
    ```

---

## 📂 Project Structure / 项目结构

```text
/
├── index.html              # Entry HTML with Tailwind CDN
├── index.tsx               # React Entry Point
├── App.tsx                 # Main Application Logic (Routing & State)
├── types.ts                # TypeScript Interfaces
├── i18n.ts                 # Localization (EN/CN)
├── services/
│   └── geminiService.ts    # Google GenAI API integration
├── components/
│   ├── BottomNav.tsx       # Navigation Bar
│   ├── LanguageToggle.tsx  # Language Switcher
│   ├── ProgressBar.tsx     # Visual Progress Component
│   └── Profile.tsx         # User Settings & Stats
└── README.md               # Documentation
```

---

## 📄 License

This project is licensed under the MIT License.
