import { Link, useLocation } from "react-router";
import { ReactNode } from "react";

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  labelHi: string;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/farmer" || path === "/buyer") {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-20 px-2">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={active ? "scale-110" : ""}>{item.icon}</div>
              <span className="text-[10px] font-medium text-center leading-tight">
                {item.label}
                <span className="block text-[9px] opacity-80">{item.labelHi}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
