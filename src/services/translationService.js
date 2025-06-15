import axios from "axios";

// Export supported languages for the MyMemory API
export const SUPPORTED_LANGUAGES = {
  German: "de-DE",
  Spanish: "es-ES",
  French: "fr-FR",
  Italian: "it-IT",
  Portuguese: "pt-PT",
  Russian: "ru-RU",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Chinese: "zh-CN",
  Arabic: "ar-SA",
  Hindi: "hi-IN",
  Turkish: "tr-TR",
  Dutch: "nl-NL",
  Polish: "pl-PL",
  Vietnamese: "vi-VN",
  Thai: "th-TH",
};

export const translateText = async (text, sourceLang, targetLang) => {
  try {
    // Convert language codes to MyMemory format (just 2 letters)
    const fromLang = sourceLang.slice(0, 2);
    const toLang = targetLang.slice(0, 2);

    console.log(`Translating from ${fromLang} to ${toLang}: "${text}"`);

    const response = await axios.get(
      `https://api.mymemory.translated.net/get`,
      {
        params: {
          q: text,
          langpair: `${fromLang}|${toLang}`,
        },
      }
    );

    console.log("Translation response:", response.data);

    if (response.data && response.data.responseData) {
      return response.data.responseData.translatedText;
    } else {
      throw new Error("Translation response format unexpected");
    }
  } catch (error) {
    console.error("Translation error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Translation failed: ${error.message}`);
  }
};
