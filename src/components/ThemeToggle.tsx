import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm transition-all duration-200 ease-ios active:scale-95 flex items-center gap-2"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={16} />
          Light Mode
        </>
      ) : (
        <>
          <Moon size={16} />
          Dark Mode
        </>
      )}
    </button>
  );
};
