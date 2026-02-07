import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-muted/80 text-foreground/80 hover:text-foreground"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        isDark ? "bg-amber-500/10" : "bg-indigo-500/10"
      )}>
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500" />
        )}
      </div>
      {!collapsed && (
        <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
      )}
    </button>
  );
}
