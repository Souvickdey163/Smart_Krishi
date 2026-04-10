import { Mic } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleVoiceClick = () => {
    const basePath = location.pathname.includes("/buyer") ? "/buyer" : "/farmer";
    navigate(`${basePath}/voice-help`);
  };

  return (
    <button
      onClick={handleVoiceClick}
      className={`fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all ${
        isListening
          ? "bg-destructive animate-pulse"
          : "bg-primary hover:bg-primary/90"
      }`}
      aria-label="Voice Assistant"
    >
      <Mic className="w-7 h-7 text-primary-foreground" />
    </button>
  );
}