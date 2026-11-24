'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotificationsCount } from '../hooks/use-notifications';
import type { NotificationBellProps } from '../types/notification-bell-props.types';

export function NotificationBell({ variant = 'default' }: NotificationBellProps) {
  const { data } = useUnreadNotificationsCount();
  const unreadCount = data?.count ?? 0;
  const formattedCount = unreadCount > 99 ? '99+' : String(unreadCount);
  const isFloating = variant === 'floating';
  const label = isFloating ? 'Notificaciones pendientes' : 'Notificaciones';

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `${label}, ${unreadCount} sin leer` : label}
      className={cn(
        'inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2',
        isFloating
          ? 'fixed right-6 bottom-6 z-40 size-12 rounded-xl border-2 border-primary bg-surface text-primary shadow-md transition-transform hover:scale-105 hover:bg-interaction focus-visible:outline-primary'
          : 'relative size-9 rounded-md text-app-header-foreground transition-colors hover:bg-app-header-foreground/10 focus-visible:outline-app-header-foreground',
      )}
    >
      <Bell className={isFloating ? 'size-6' : 'size-5'} aria-hidden="true" />
      {unreadCount > 0 ? (
        <span
          className={cn(
            'absolute inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] leading-none text-brand-red-foreground',
            isFloating ? '-top-2 -right-2 font-bold shadow-xs' : '-top-0.5 -right-0.5 font-semibold',
          )}
        >
          {formattedCount}
        </span>
      ) : null}
    </Link>
  );
}