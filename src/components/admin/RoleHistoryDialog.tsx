import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

interface RoleChange {
  id: string;
  user_id: string;
  changed_by: string;
  old_role: string | null;
  new_role: string | null;
  reason: string;
  action_type: 'add' | 'remove' | 'update';
  created_at: string;
  reverted_at: string | null;
  reverted_by: string | null;
  changed_by_email?: string;
  reverted_by_email?: string | null;
}

export function RoleHistoryDialog({ open, onOpenChange, userId, userName }: RoleHistoryDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [selectedChange, setSelectedChange] = useState<RoleChange | null>(null);

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['role-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_change_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch email addresses for changed_by and reverted_by
      const changes = data as RoleChange[];
      const userIds = [
        ...new Set([
          ...changes.map(c => c.changed_by),
          ...changes.filter(c => c.reverted_by).map(c => c.reverted_by!),
        ]),
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

      return changes.map(change => ({
        ...change,
        changed_by_email: emailMap.get(change.changed_by) || 'Unknown',
        reverted_by_email: change.reverted_by ? emailMap.get(change.reverted_by) || 'Unknown' : null,
      }));
    },
    enabled: open,
  });

  const handleRevert = async () => {
    if (!selectedChange) return;

    setRevertingId(selectedChange.id);
    try {
      // Determine the action: if it was 'add', we remove; if 'remove', we add back
      if (selectedChange.action_type === 'add' && selectedChange.new_role) {
        // Remove the role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', selectedChange.new_role as any);

        if (deleteError) throw deleteError;
      } else if (selectedChange.action_type === 'remove' && selectedChange.old_role) {
        // Add the role back
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: selectedChange.old_role as any,
            created_by: currentUser?.id,
          }]);

        if (insertError) throw insertError;
      }

      // Mark as reverted
      const { error: updateError } = await supabase
        .from('role_change_history')
        .update({
          reverted_at: new Date().toISOString(),
          reverted_by: currentUser?.id,
        })
        .eq('id', selectedChange.id);

      if (updateError) throw updateError;

      toast({
        title: "Role Change Reverted",
        description: "Successfully reverted the role change",
      });

      refetch();
      setShowRevertConfirm(false);
      setSelectedChange(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revert role change",
        variant: "destructive",
      });
    } finally {
      setRevertingId(null);
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'add':
        return <Badge variant="default">Added</Badge>;
      case 'remove':
        return <Badge variant="destructive">Removed</Badge>;
      case 'update':
        return <Badge variant="secondary">Updated</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Role Change History for {userName}</DialogTitle>
            <DialogDescription>
              Complete audit log of all role changes for this user
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((change) => (
                <div
                  key={change.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    change.reverted_at ? 'bg-muted/50 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(change.action_type)}
                        {change.old_role && (
                          <>
                            <Badge variant="outline">{change.old_role}</Badge>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        {change.new_role && (
                          <Badge variant="default">{change.new_role}</Badge>
                        )}
                        {change.reverted_at && (
                          <Badge variant="secondary">Reverted</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {change.reason}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <strong>Changed by:</strong> {change.changed_by_email}
                        </div>
                        <div>
                          <strong>When:</strong> {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                        </div>
                        {change.reverted_at && (
                          <>
                            <div>
                              <strong>Reverted by:</strong> {change.reverted_by_email}
                            </div>
                            <div>
                              <strong>Reverted:</strong> {formatDistanceToNow(new Date(change.reverted_at), { addSuffix: true })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {!change.reverted_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedChange(change);
                          setShowRevertConfirm(true);
                        }}
                        disabled={revertingId === change.id}
                      >
                        {revertingId === change.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Revert
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No role changes recorded for this user
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Revert</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {selectedChange && (
                <>
                  <div>
                    Are you sure you want to revert this role change?
                  </div>
                  {selectedChange.action_type === 'add' && (
                    <div className="text-sm">
                      This will <strong>remove</strong> the <strong>{selectedChange.new_role}</strong> role from the user.
                    </div>
                  )}
                  {selectedChange.action_type === 'remove' && (
                    <div className="text-sm">
                      This will <strong>restore</strong> the <strong>{selectedChange.old_role}</strong> role to the user.
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!revertingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} disabled={!!revertingId}>
              {revertingId ? 'Reverting...' : 'Confirm Revert'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
