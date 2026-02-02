import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  scope?: 'global' | 'admin';
}

export const useKeyboardShortcuts = (isAdmin: boolean = false) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  const isAdminRoute = location.pathname.includes('/supersmartkenyaadmin123');

  const shortcuts: ShortcutConfig[] = [
    // Global shortcuts
    { key: '/', description: 'Focus search', action: () => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(), scope: 'global' },
    { key: 'h', ctrl: true, description: 'Go to homepage', action: () => navigate('/'), scope: 'global' },
    { key: 'Escape', description: 'Close dialogs/modals', action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })), scope: 'global' },
    { key: '?', shift: true, description: 'Show keyboard shortcuts', action: () => setShowShortcutsDialog(true), scope: 'global' },
    
    // Admin shortcuts (only active on admin routes)
    { key: 'd', ctrl: true, shift: true, description: 'Go to dashboard', action: () => navigate('/supersmartkenyaadmin123'), scope: 'admin' },
    { key: 'p', ctrl: true, shift: true, description: 'Go to products', action: () => navigate('/supersmartkenyaadmin123/products'), scope: 'admin' },
    { key: 'o', ctrl: true, shift: true, description: 'Go to orders', action: () => navigate('/supersmartkenyaadmin123/orders'), scope: 'admin' },
    { key: 'n', ctrl: true, shift: true, description: 'Add new product', action: () => navigate('/supersmartkenyaadmin123/products/add'), scope: 'admin' },
    { key: 'r', ctrl: true, shift: true, description: 'Refresh page data', action: () => window.location.reload(), scope: 'admin' },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Exception for Escape key and search focus
      if (event.key !== 'Escape' && event.key !== '/') {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      // Check scope
      if (shortcut.scope === 'admin' && (!isAdmin || !isAdminRoute)) continue;

      // Check key combination
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatches = !!shortcut.shift === event.shiftKey;
      const altMatches = !!shortcut.alt === event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [navigate, isAdmin, isAdminRoute, shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getActiveShortcuts = () => {
    return shortcuts.filter(s => {
      if (s.scope === 'admin') return isAdmin && isAdminRoute;
      return true;
    });
  };

  const formatShortcut = (shortcut: ShortcutConfig) => {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push('⌘/Ctrl');
    if (shortcut.shift) keys.push('⇧');
    if (shortcut.alt) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  return {
    shortcuts: getActiveShortcuts(),
    formatShortcut,
    showShortcutsDialog,
    setShowShortcutsDialog
  };
};
