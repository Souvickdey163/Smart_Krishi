import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Sprout, Cpu } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary to-primary/80 p-6">
      <div className="animate-[fadeIn_0.8s_ease-in]">
        <div className="relative mb-8">
          {/* Logo Icon */}
          <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
            <div className="relative">
              <Sprout className="w-16 h-16 text-primary" strokeWidth={2.5} />
              <div className="absolute -top-2 -right-2 bg-accent rounded-full p-2">
                <Cpu className="w-6 h-6 text-secondary" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl -z-10" />
        </div>

        {/* App Name */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-white mb-2">
            Smart Krishi
          </h1>
          <p className="text-xl text-white/90 mb-1">स्मार्ट कृषि</p>
          <p className="text-sm text-white/80 tracking-wide">
            AI-Powered Farming Ecosystem
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-white/60 text-xs">
        Version 1.0.0 | Empowering Farmers
      </div>
    </div>
  );
}
