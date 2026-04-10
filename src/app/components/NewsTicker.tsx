import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import type { CropNews } from '../services/marketService';

interface NewsTickerProps {
  news: CropNews[];
  isLoading?: boolean;
}

export default function NewsTicker({ news, isLoading }: NewsTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isPaused || !scrollRef.current || news.length === 0) return;

    const container = scrollRef.current;
    let animationId: number;
    let scrollPos = 0;

    const scroll = () => {
      scrollPos += 0.5;
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, news]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Latest Crop News</span>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 h-16 bg-muted/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  const categoryColors: Record<string, string> = {
    price: 'bg-green-100 text-green-700',
    policy: 'bg-blue-100 text-blue-700',
    weather: 'bg-yellow-100 text-yellow-700',
    supply: 'bg-purple-100 text-purple-700',
    market: 'bg-orange-100 text-orange-700',
    tech: 'bg-cyan-100 text-cyan-700',
    news: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Latest Crop News | फसल समाचार</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          setExpandedIndex(null);
        }}
      >
        {/* Duplicate news items for infinite scroll effect */}
        {[...news, ...news].map((item, index) => (
          <div
            key={index}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className={`flex-shrink-0 w-72 bg-card rounded-xl p-3 border border-border 
              hover:border-primary/40 hover:shadow-md transition-all cursor-pointer
              ${expandedIndex === index ? 'ring-2 ring-primary/30' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[item.category] || categoryColors.news}`}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </span>
              {item.url && item.url !== '#' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs font-medium leading-snug line-clamp-2 mb-1">
              {item.title}
            </p>
            {item.titleHi && (
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1 mb-1.5">
                {item.titleHi}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{item.source}</span>
              <span className="text-[10px] text-muted-foreground">{item.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
