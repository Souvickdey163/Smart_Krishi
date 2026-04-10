import React, { createContext, useContext, useState, useEffect } from 'react';

// Common languages for Indian agriculture (13 total)
export type AppLanguage = 'English' | 'हिंदी' | 'বাংলা' | 'ਪੰਜਾਬੀ' | 'తెలుగు' | 'தமிழ்' | 'मराठी' | 'ગુજરાતી' | 'ಕನ್ನಡ' | 'മലയാളം' | 'ଓଡ଼ିଆ' | 'অসমীয়া' | 'اردو';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
  allLanguages: AppLanguage[];
  languageCode: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const ALL_LANGUAGES: AppLanguage[] = ['English', 'हिंदी', 'বাংলা', 'ਪੰਜਾਬੀ', 'తెలుగు', 'தமிழ்', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ଓଡ଼ିଆ', 'অসমীয়া', 'اردو'];

// BCP-47 language codes for Speech API
export const LANGUAGE_CODES: Record<AppLanguage, string> = {
  "English": "en-IN",
  "हिंदी": "hi-IN",
  "বাংলা": "bn-IN",
  "ਪੰਜਾਬੀ": "pa-IN",
  "తెలుగు": "te-IN",
  "தமிழ்": "ta-IN",
  "मराठी": "mr-IN",
  "ગુજરાતી": "gu-IN",
  "ಕನ್ನಡ": "kn-IN",
  "മലയാളം": "ml-IN",
  "ଓଡ଼ିଆ": "or-IN",
  "অসমীয়া": "as-IN",
  "اردو": "ur-IN",
};

// Human-readable English names
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  "English": "English",
  "हिंदी": "Hindi",
  "বাংলা": "Bengali",
  "ਪੰਜਾਬੀ": "Punjabi",
  "తెలుగు": "Telugu",
  "தமிழ்": "Tamil",
  "मराठी": "Marathi",
  "ગુજરાતી": "Gujarati",
  "ಕನ್ನಡ": "Kannada",
  "മലയാളം": "Malayalam",
  "ଓଡ଼ିଆ": "Odia",
  "অসমীয়া": "Assamese",
  "اردو": "Urdu",
};

// High-frequency dictionary
const translations: Record<string, Record<AppLanguage, string>> = {
  // Navigation & Home
  "Namaste, Farmer 🌱": {
    "English": "Namaste, Farmer 🌱",
    "हिंदी": "नमस्ते, किसान जी 🌱",
    "বাংলা": "নমস্কার, কৃষক 🌱",
    "ਪੰਜਾਬੀ": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਸਾਨ ਜੀ 🌱",
    "తెలుగు": "నమస్తే, రైతన్నా 🌱",
    "தமிழ்": "வணக்கம், விவசாயி 🌱",
    "मराठी": "नमस्कार, शेतकरी 🌱",
    "ગુજરાતી": "નમસ્તે, ખેડૂત 🌱",
    "ಕನ್ನಡ": "ನಮಸ್ಕಾರ, ರೈತ 🌱",
    "മലയാളം": "നമസ്കാരം, കർഷക 🌱",
    "ଓଡ଼ିଆ": "ନମସ୍କାର, କୃଷକ 🌱",
    "অসমীয়া": "নমস্কাৰ, কৃষক 🌱",
    "اردو": "नमस्ते، کسان 🌱"
  },
  "Scan Crop": {
    "English": "Scan Crop",
    "हिंदी": "फसल स्कैन",
    "বাংলা": "ফসল স্ক্যান",
    "ਪੰਜਾਬੀ": "ਫਸਲ ਸਕੈਨ",
    "తెలుగు": "పంటను స్కాన్ చేయండి",
    "தமிழ்": "பயிரை ஸ்கேன் செய்",
    "मराठी": "पीक स्कॅन",
    "ગુજરાતી": "પાક સ્કેન",
    "ಕನ್ನಡ": "ಬೆಳೆ ಸ್ಕ್ಯಾನ್",
    "മലയാളം": "ക്രോപ്പ് സ്കാൻ",
    "ଓଡ଼ିଆ": "ଫସଲ ସ୍କାନ",
    "অসমীয়া": "শস্য স্কেন",
    "اردو": "فصل اسکین"
  },
  "Sell Crops": {
    "English": "Sell Crops",
    "हिंदी": "फसल बेचें",
    "বাংলা": "ফসল বিক্রি",
    "ਪੰਜਾਬੀ": "ਫਸਲ ਵੇਚੋ",
    "తెలుగు": "పంటలను అమ్మండి",
    "தமிழ்": "பயிர்களை விற்கவும்",
    "मराठी": "पीक विका",
    "ગુજરાતી": "પાક વેચો",
    "ಕನ್ನಡ": "ಬೆಳೆಗಳನ್ನು ಮಾರಿ",
    "മലയാളം": "വിളകൾ വിൽക്കുക",
    "ଓଡ଼ିଆ": "ଫସଲ ବିକ୍ରି",
    "অসমীয়া": "শস্য বিক্ৰী",
    "اردو": "فصلیں فروخت کریں"
  },
  "Market Prices": {
    "English": "Market Prices",
    "हिंदी": "बाज़ार कीमत",
    "বাংলা": "বাজার দাম",
    "ਪੰਜਾਬੀ": "ਮੰਡੀ ਦੇ ਭਾਅ",
    "తెలుగు": "మార్కెట్ ధరలు",
    "தமிழ்": "சந்தை விலைகள்",
    "मराठी": "बाजारभाव",
    "ગુજરાતી": "બજાર ભાવ",
    "ಕನ್ನಡ": "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
    "മലയാളം": "വിപണി വില",
    "ଓଡ଼ିଆ": "ବଜାର ଦର",
    "অসমীয়া": "বজাৰ মূল্য",
    "اردو": "مارکیٹ کی قیمتیں"
  },
  "Voice Help": {
    "English": "Voice Help",
    "हिंदी": "आवाज़ सहायता",
    "বাংলা": "ভয়েস সাহায্য",
    "ਪੰਜਾਬੀ": "ਆਵਾਜ਼ ਸਹਾਇਤਾ",
    "తెలుగు": "వాయిస్ సహాయం",
    "தமிழ்": "குரல் உதவி",
    "मराठी": "आवाज मदत",
    "ગુજરાતી": "અવાજ સહાય",
    "ಕನ್ನಡ": "ಧ್ವನಿ ಸಹಾಯ",
    "മലയാളം": "വോയിസ് സഹായം",
    "ଓଡ଼ିଆ": "ଭଏସ୍ ସାହାଯ୍ୟ",
    "অসমীয়া": "ভয়েছ সহায়",
    "اردو": "وائس ہیلپ"
  },
  "Profile": {
    "English": "Profile",
    "हिंदी": "प्रोफाइल",
    "বাংলা": "প্রোফাইল",
    "ਪੰਜਾਬੀ": "ਪ੍ਰੋਫਾਈਲ",
    "తెలుగు": "ప్రొఫైల్",
    "தமிழ்": "சுயவிவரம்",
    "मराठी": "प्रोफाइल",
    "ગુજરાતી": "પ્રોફાઇલ",
    "ಕನ್ನಡ": "ಪ್ರೊಫೈಲ್",
    "മലയാളം": "പ്രൊഫൈൽ",
    "ଓଡ଼ିଆ": "ପ୍ରୋଫାଇଲ୍",
    "অসমীয়া": "প্ৰফাইল",
    "اردو": "پروفائل"
  },
  "Logout": {
    "English": "Logout",
    "हिंदी": "लॉग आउट",
    "বাংলা": "লগ আউট",
    "ਪੰਜਾਬੀ": "ਲਾਗ ਆਉਟ",
    "తెలుగు": "లాగ్ అవుట్",
    "தமிழ்": "வெளியேறு",
    "मराठी": "लॉग आउट",
    "ગુજરાતી": "લૉગ આઉટ",
    "ಕನ್ನಡ": "ಲಾಗ್ ಔಟ್",
    "മലയാളം": "ലോഗ് ഔട്ട്",
    "ଓଡ଼ିଆ": "ଲଗ୍ ଆଉଟ୍",
    "অসমীয়া": "লগ আউট",
    "اردو": "لاگ آؤٹ"
  },
  "Settings": {
    "English": "Settings",
    "हिंदी": "सेटिंग्स",
    "বাংলা": "সেটিংস",
    "ਪੰਜਾਬੀ": "ਸੈਟਿੰਗਜ਼",
    "తెలుగు": "సెట్టింగులు",
    "தமிழ்": "அமைப்புகள்",
    "मराठी": "सेटिंग्ज",
    "ગુજરાતી": "સેટિંગ્સ",
    "ಕನ್ನಡ": "ಸೆಟ್ಟಿಂಗ್ಸ್",
    "മലയാളം": "സെറ്റിംഗ്സ്",
    "ଓଡ଼ିଆ": "ସେଟିଂସ",
    "অসমীয়া": "ছেটিংছ",
    "اردو": "ترتیبات"
  },
  "Language": {
    "English": "Language",
    "हिंदी": "भाषा",
    "বাংলা": "ভাষা",
    "ਪੰਜਾਬੀ": "ਭਾਸ਼ਾ",
    "తెలుగు": "భాష",
    "தமிழ்": "மொழி",
    "मराठी": "भाषा",
    "ગુજરાતી": "ભાષા",
    "ಕನ್ನಡ": "ಭಾಷೆ",
    "മലയാളം": "ഭാഷ",
    "ଓଡ଼ିଆ": "ଭାଷା",
    "অসমীয়া": "ভাষা",
    "اردو": "زبان"
  },
  "Notifications": {
    "English": "Notifications",
    "हिंदी": "सूचनाएं",
    "বাংলা": "বিজ্ঞপ্তি",
    "ਪੰਜਾਬੀ": "ਸੂਚਨਾਵਾਂ",
    "తెలుగు": "నోటిఫికేషన్లు",
    "தமிழ்": "அறிவிப்புகள்",
    "मराठी": "सूचना",
    "ગુજરાતી": "સૂચનાઓ",
    "ಕನ್ನಡ": "ಅಧಿಸೂಚನೆಗಳು",
    "മലയാളം": "അറിയിപ്പുകൾ",
    "ଓଡ଼ିଆ": "ବିଜ୍ଞପ୍ତି",
    "অসমীয়া": "জাননী",
    "اردو": "اطلاعات"
  },
  "Recent Updates": {
    "English": "Recent Updates",
    "हिंदी": "हाल के अपडेट",
    "বাংলা": "সাম্প্রতিক আপডেট",
    "ਪੰਜਾਬੀ": "ਤਾਜ਼ਾ ਅਪਡੇਟਸ",
    "తెలుగు": "తాజా నవీకరణలు",
    "தமிழ்": "சமீபத்திய புதுப்பிப்புகள்",
    "मराठी": "अलीकडील अपडेट्स",
    "ગુજરાતી": "તાજેતરના અપડેટ્સ",
    "ಕನ್ನಡ": "ಇತ್ತೀಚಿನ ನವೀಕರಣಗಳು",
    "മലയാളം": "അവസാന് അപ്ഡേറ്റുകൾ",
    "ଓଡ଼ିଆ": "ସାମ୍ପ୍ରତିକ ଅପଡେଟ୍",
    "অসমীয়া": "শেহতীয়া আপডেট",
    "اردو": "حالیہ اپڈیٹس"
  },
  "Today's Weather": {
    "English": "Today's Weather",
    "हिंदी": "आज का मौसम",
    "বাংলা": "আজকের আবহাওয়া",
    "ਪੰਜਾਬੀ": "ਅੱਜ ਦਾ ਮੌਸਮ",
    "తెలుగు": "నేటి వాతావరణం",
    "தமிழ்": "இன்றைய வானிலை",
    "मराठी": "आजचे हवामान",
    "ગુજરાતી": "આજનું હવામાન",
    "ಕನ್ನಡ": "ಇಂದಿನ ಹವಾಮಾನ",
    "മലയാളം": "ഇന്നത്തെ കാലാവസ്ഥ",
    "ଓଡ଼ିଆ": "ଆଜିର ପାଣିପାଗ",
    "অসমীয়া": "আজিৰ বতৰ",
    "اردو": "آج کا موسم"
  },
  "Profile updated": {
    "English": "Profile updated",
    "हिंदी": "प्रोफाइल अपडेट हो गया",
    "বাংলা": "প্রোফাইল আপডেট হয়েছে",
    "ਪੰਜਾਬੀ": "ਪ੍ਰੋਫਾਈਲ ਅੱਪਡੇਟ ਹੋ ਗਈ",
    "తెలుగు": "ప్రొఫైల్ అప్‌డేట్ అయింది",
    "தமிழ்": "சுயவிவரம் புதுப்பிக்கப்பட்டது",
    "मराठी": "प्रोफाइल अपडेट झाले",
    "ગુજરાતી": "પ્રોફાઇલ અપડેટ થઈ",
    "ಕನ್ನಡ": "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ",
    "മലയാളം": "പ്രൊഫൈൽ പുതുക്കി",
    "ଓଡ଼ିଆ": "ପ୍ରୋଫାଇଲ୍ ଅପଡେଟ୍ ହୋଇଛି",
    "অসমীয়া": "প্ৰফাইল আপডেট কৰা হ'ল",
    "اردو": "پروفائل اپڈیٹ ہو گئی"
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved language or default to English
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved as AppLanguage) || 'English';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (entry) {
      return entry[language];
    }
    // If exact translation is missing, return English with a prefix if not targeting English
    if (language !== 'English') {
      const prefixMap: Record<string, string> = {
        "हिंदी": "(हि)",
        "বাংলা": "(বা)",
        "ਪੰਜਾਬੀ": "(ਪੰ)",
        "తెలుగు": "(తె)",
        "தமிழ்": "(த)",
        "मराठी": "(म)",
        "ગુજરાતી": "(ગુ)",
        "ಕನ್ನಡ": "(ಕ)",
        "മലയാളം": "(മ)",
        "ଓଡ଼ିଆ": "(ଓ)",
        "অসমীয়া": "(অ)",
        "اردو": "(ا)"
      };
      return `${prefixMap[language] || ''} ${key}`;
    }
    return key;
  };

  const languageCode = LANGUAGE_CODES[language] || 'en-IN';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, allLanguages: ALL_LANGUAGES, languageCode }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
