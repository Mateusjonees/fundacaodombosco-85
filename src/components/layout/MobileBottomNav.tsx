import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, MessageSquare, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Painel' },
  { to: '/schedule', icon: Calendar, label: 'Agenda' },
  { to: '/clients', icon: Users, label: 'Pacientes' },
  { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
] as const;

export const MobileBottomNav = memo(() => {
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border/60 flex items-center justify-around z-50 md:hidden safe-area-bottom">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
            isActive(to)
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Icon className={cn("h-5 w-5", isActive(to) && "stroke-[2.5]")} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
      <button
        onClick={() => setOpenMobile(true)}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
