import { ArrowLeft, Mic, Send, Volume2, Sparkles, VolumeX, Leaf, Bug, DollarSign, Droplets, Building2, Wheat } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
}

// Ensure TypeScript knows about window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Simple markdown-like renderer for AI responses
function formatAIText(text: string) {
  // Split into lines and process
  return text.split('\n').map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('(')) {
      return <div key={i} className="pl-2 py-0.5">{rendered}</div>;
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return <div key={i}>{rendered}</div>;
  });
}

export default function VoiceHelp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, languageCode, t } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: "Namaste! 🙏 I am Smart Krishi AI — your personal farming assistant. I can help you with:\n\n🌾 Crop prices & MSP\n🌱 Planting & harvesting advice\n🐛 Disease & pest control\n🧪 Soil & fertilizer guidance\n💧 Irrigation tips\n🏛️ Government schemes\n🐄 Livestock advice\n\nJust ask your question in any language!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Generate a simple session ID for conversation memory
  const sessionId = useMemo(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`, []);

  const isFarmerRoute = location.pathname.includes("/farmer");
  const backRoute = isFarmerRoute ? "/farmer" : "/buyer";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup Web Speech API (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      if(isListening && recognitionRef.current){
        recognitionRef.current.stop();
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Use the languageCode directly from context
      recognitionRef.current.lang = languageCode;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendAutomated(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error("Microphone error. Please type instead.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [languageCode]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean markdown for speech
    const cleanText = text.replace(/\*\*/g, '').replace(/[📊📈📉🌾🍚☁️🍅🥔🧅🫘🌻💡🙏🌱🐛🧪💧🏛️🐄📅]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = languageCode;
    utterance.rate = 0.9;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendAutomated = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);
    setActiveCategory(null); // Collapse suggestions after sending

    try {
      // Send conversation history for context-aware responses
      const conversationHistory = updatedMessages.slice(-8).map(m => ({
        type: m.type,
        text: m.text,
      }));

      const response = await fetch("http://localhost:3001/api/voice-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: textToSend,
          languageContext: language,
          sessionId,
          conversationHistory,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          text: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        speakText(data.reply);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to connect to AI assistant");
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    handleSendAutomated(inputText);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          toast.success("Listening...");
        } catch (e) {
          console.error(e);
        }
      } else {
        toast.error("Speech Recognition is not supported in this browser.");
      }
    }
  };

  // Categorized suggested questions
  const questionCategories = [
    {
      id: "crops",
      label: "🌾 Crops",
      icon: Wheat,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      questions: [
        { text: "When should I plant wheat this season?", textHi: "गेहूं कब बोये?" },
        { text: "Best rice varieties for high yield?", textHi: "अच्छी उपज वाली धान की किस्म?" },
        { text: "How to harvest sugarcane properly?", textHi: "गन्ने की कटाई कैसे करें?" },
        { text: "What is the best crop rotation plan?", textHi: "फसल चक्र कैसा रखें?" },
      ],
    },
    {
      id: "diseases",
      label: "🐛 Diseases",
      icon: Bug,
      color: "bg-red-100 text-red-700 border-red-200",
      questions: [
        { text: "Yellow spots on my wheat leaves", textHi: "गेहूं पर पीले धब्बे" },
        { text: "How to control whitefly in cotton?", textHi: "कपास में सफेद मक्खी नियंत्रण" },
        { text: "Tomato leaves are curling upward", textHi: "टमाटर की पत्तियां मुड़ रही हैं" },
        { text: "Potato blight prevention tips", textHi: "आलू झुलसा रोग से बचाव" },
      ],
    },
    {
      id: "prices",
      label: "💰 Prices",
      icon: DollarSign,
      color: "bg-green-100 text-green-700 border-green-200",
      questions: [
        { text: "What is the current wheat price?", textHi: "आज गेहूं का भाव?" },
        { text: "Show me today's mandi prices", textHi: "आज मंडी के भाव बताओ" },
        { text: "What is MSP for Kharif crops?", textHi: "खरीफ फसलों का MSP?" },
        { text: "Tips for getting better selling price", textHi: "अच्छा भाव कैसे मिले?" },
      ],
    },
    {
      id: "soil",
      label: "🧪 Soil",
      icon: Leaf,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      questions: [
        { text: "How to test soil at home?", textHi: "मिट्टी की जांच कैसे कराएं?" },
        { text: "My soil has nitrogen deficiency", textHi: "मिट्टी में नाइट्रोजन की कमी" },
        { text: "How to make Jeevamrut at home?", textHi: "जीवामृत कैसे बनाएं?" },
        { text: "Best organic fertilizer options", textHi: "जैविक खाद के विकल्प?" },
      ],
    },
    {
      id: "water",
      label: "💧 Water",
      icon: Droplets,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      questions: [
        { text: "Drip irrigation cost and subsidy?", textHi: "ड्रिप सिंचाई खर्च और सब्सिडी?" },
        { text: "How to save water in rice farming?", textHi: "धान में पानी कैसे बचायें?" },
        { text: "Rainwater harvesting for farms", textHi: "खेत में बारिश का पानी कैसे जमा करें?" },
        { text: "When to irrigate wheat crop?", textHi: "गेहूं में सिंचाई कब करें?" },
      ],
    },
    {
      id: "schemes",
      label: "🏛️ Schemes",
      icon: Building2,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      questions: [
        { text: "How to apply for PM-KISAN?", textHi: "PM-KISAN के लिए कैसे अप्लाई करें?" },
        { text: "Crop insurance under PMFBY", textHi: "PMFBY फसल बीमा कैसे लें?" },
        { text: "Solar pump subsidy under PM-KUSUM", textHi: "PM-KUSUM सोलर पम्प सब्सिडी?" },
        { text: "How to get KCC loan at 4%?", textHi: "KCC लोन 4% पर कैसे लें?" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-accent to-accent/90 pt-12 pb-6 px-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              navigate(backRoute);
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-bold text-white">{t("Voice Help")}</h1>
            </div>
            <p className="text-white/90 text-sm">Smart Krishi AI • 15+ Topics • {messages.length - 1} messages</p>
          </div>
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis?.cancel();
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card border border-border shadow-sm"
              }`}
            >
              {message.type === "ai" && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold text-accent">Smart Krishi AI</span>
                </div>
              )}
              <div className="text-sm leading-relaxed">
                {message.type === "ai" ? formatAIText(message.text) : message.text}
              </div>
              <p className={`text-xs mt-1 ${
                message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {message.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-xs text-muted-foreground">Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions — Categorized */}
      {messages.length <= 2 && (
        <div className="px-6 pb-3">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {questionCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  activeCategory === cat.id
                    ? cat.color + " scale-105 shadow-md"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          {/* Questions grid for active category */}
          {activeCategory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
              {questionCategories
                .find((c) => c.id === activeCategory)
                ?.questions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendAutomated(q.text)}
                    className="p-3 bg-card border border-border rounded-xl text-sm text-left hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group"
                  >
                    <p className="font-medium group-hover:text-primary transition-colors">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{q.textHi}</p>
                  </button>
                ))}
            </div>
          )}
          
          {/* Show quick questions when no category is active */}
          {!activeCategory && (
            <p className="text-xs text-center text-muted-foreground mt-1">
              👆 Tap a category above for suggested questions
            </p>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4 pb-safe">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            {/* Voice Button */}
            <button
              onClick={handleVoiceInput}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-destructive animate-pulse shadow-lg shadow-destructive/30"
                  : "bg-primary hover:bg-primary/90 hover:shadow-md"
              }`}
            >
              <Mic className="w-6 h-6 text-primary-foreground" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type or speak your question... / अपना सवाल पूछें"
                className="min-h-[48px] max-h-[120px] pr-12 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className="absolute right-2 bottom-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
