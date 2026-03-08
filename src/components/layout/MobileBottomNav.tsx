import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, MessageSquare, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
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
  const { user } = useAuth();

  // Unread messages count for badge
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('internal_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      return count || 0;
    },
    staleTime: 30000,
    enabled: !!user?.id,
  });

  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 landscape-nav-height bg-background/95 backdrop-blur-lg border-t border-border/60 flex items-center justify-around z-50 md:hidden landscape-show safe-area-bottom">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors landscape-nav-item relative",
            isActive(to)
              ? "text-primary"
              : "text-muted-foreground"
          )}
          aria-label={label}
        >
          <div className="relative">
            <Icon className={cn("h-5 w-5 landscape-nav-icon", isActive(to) && "stroke-[2.5]")} />
            {to === '/messages' && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium landscape-nav-label">{label}</span>
        </NavLink>
      ))}
      <button
        onClick={() => setOpenMobile(true)}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors landscape-nav-item"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 landscape-nav-icon" />
        <span className="text-[10px] font-medium landscape-nav-label">Menu</span>
      </button>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
