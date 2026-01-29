import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProficiencyLevel, VocabWord, PlacementQuestion, StoryData } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVocabulary = async (
  level: ProficiencyLevel,
  count: number
): Promise<VocabWord[]> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";

  const prompt = `Generate ${count} English vocabulary words suitable for a ${level} level learner. 
  Include the word, IPA pronunciation, English definition, Chinese definition, an example sentence, and the Chinese translation of the word.
  Ensure the words are useful for daily conversation or academic contexts depending on the level.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            definition_en: { type: Type.STRING },
            definition_zh: { type: Type.STRING },
            example_sentence: { type: Type.STRING },
            translation_zh: { type: Type.STRING },
          },
          required: ["word", "pronunciation", "definition_en", "definition_zh", "example_sentence", "translation_zh"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  
  try {
    return JSON.parse(text) as VocabWord[];
  } catch (e) {
    console.error("Failed to parse vocabulary JSON", e);
    return [];
  }
};

export const generatePlacementTest = async (): Promise<PlacementQuestion[]> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";
  
  const prompt = `Create a comprehensive 10-question English placement test. 
  The questions should progressively increase in difficulty from Beginner (questions 1-3) to Intermediate (questions 4-7) to Advanced (questions 8-10).
  Cover grammar, vocabulary, and reading comprehension logic.
  For each question, provide a short 'explanation' of why the correct answer is right.
  Return a JSON array.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ["question", "options", "correctIndex", "explanation"],
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
};

export const generateStory = async (words: string[], level: ProficiencyLevel): Promise<StoryData> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";

  const prompt = `Write a short, engaging story (approx 100-150 words) tailored to a ${level} English learner.
  You MUST include the following words in the story: ${words.join(", ")}.
  
  Return a JSON object with the following fields:
  - title: A creative title for the story.
  - english: The English story text. Highlight the required words by wrapping them in markdown bold (**word**).
  - chinese: A natural Chinese translation of the story.
  - keywords: A list of the required words plus 2-3 other potentially difficult words from the story, with concise Chinese definitions.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          english: { type: Type.STRING },
          chinese: { type: Type.STRING },
          keywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                definition: { type: Type.STRING },
              },
              required: ["word", "definition"],
            },
          },
        },
        required: ["title", "english", "chinese", "keywords"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No story generated");
  
  try {
    return JSON.parse(text) as StoryData;
  } catch (e) {
    console.error("Failed to parse story JSON", e);
    throw new Error("Invalid story format");
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text) return null;
  const ai = getAIClient();
  const model = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        role: "user",
        parts: [{ text: text }]
      },
      config: {
        responseModalities: ["AUDIO" as Modality],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.error("No audio data in response", JSON.stringify(response, null, 2));
        return null;
    }
    return base64Audio;
  } catch (e) {
    console.error("Failed to generate speech", e);
    return null;
  }
};