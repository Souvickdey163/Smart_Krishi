import { useState } from "react";
import { Globe, X, Check } from "lucide-react";
import { useLanguage, ALL_LANGUAGES, LANGUAGE_NAMES, type AppLanguage } from "../context/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: AppLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // Short label for the floating pill
  const shortLabel: Record<AppLanguage, string> = {
    "English": "EN",
    "हिंदी": "हि",
    "বাংলা": "বা",
    "ਪੰਜਾਬੀ": "ਪੰ",
    "తెలుగు": "తె",
    "தமிழ்": "த",
    "मराठी": "म",
    "ગુજરાતી": "ગુ",
    "ಕನ್ನಡ": "ಕ",
    "മലയാളം": "മ",
    "ଓଡ଼ିଆ": "ଓ",
    "অসমীয়া": "অ",
    "اردو": "ا",
  };

  return (
    <>
      {/* Floating pill button — always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 bg-card/90 backdrop-blur-md border border-border shadow-lg rounded-full pl-3 pr-3.5 py-2 hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold text-primary">{shortLabel[language]}</span>
      </button>

      {/* Language selection overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background w-[90%] max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">Select Language</h3>
                  <p className="text-white/80 text-xs">भाषा चुनें • ভাষা নির্বাচন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Language grid */}
            <div className="p-4 grid grid-cols-2 gap-2">
              {ALL_LANGUAGES.map((lang) => {
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => handleSelect(lang)}
                    className={`relative flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-2xl font-bold">{shortLabel[lang]}</span>
                    <span className={`text-sm font-semibold ${isActive ? "text-primary" : ""}`}>
                      {lang}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {LANGUAGE_NAMES[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
