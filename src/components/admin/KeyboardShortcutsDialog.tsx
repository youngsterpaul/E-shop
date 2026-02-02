import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export const KeyboardShortcutsDialog = ({ open, onOpenChange, isAdmin = false }: KeyboardShortcutsDialogProps) => {
  const { shortcuts, formatShortcut } = useKeyboardShortcuts(isAdmin);

  const globalShortcuts = shortcuts.filter(s => s.scope === 'global' || !s.scope);
  const adminShortcuts = shortcuts.filter(s => s.scope === 'admin');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Global Shortcuts */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">General</h4>
            <div className="space-y-2">
              {globalShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatShortcut(shortcut)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Shortcuts */}
          {isAdmin && adminShortcuts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Admin Panel</h4>
              <div className="space-y-2">
                {adminShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Press <Badge variant="outline" className="font-mono text-xs mx-1">⇧ + ?</Badge> to show this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
};
