import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/hooks/useUserRole';

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    user_roles: { role: AppRole }[];
  };
  onSuccess: () => void;
}

const roleDescriptions: Record<AppRole, { description: string; color: string; permissions: string[] }> = {
  superadmin: {
    description: 'Full system access with all permissions',
    color: 'destructive',
    permissions: [
      'Manage all users and roles',
      'Access all admin features',
      'View security alerts and logs',
      'Modify system settings',
      'Manage products, orders, and inventory'
    ]
  },
  admin: {
    description: 'Elevated access to manage operations',
    color: 'default',
    permissions: [
      'Manage products and inventory',
      'View and update orders',
      'Manage suppliers and purchase orders',
      'Upload hero slides',
      'Manage stores',
      'Cannot access user management or security features'
    ]
  },
  moderator: {
    description: 'Limited access to products and orders',
    color: 'secondary',
    permissions: [
      'View and edit products',
      'View and update orders',
      'Cannot delete products',
      'Cannot access sensitive areas (users, security, settings)',
      'View activity logs'
    ]
  },
  user: {
    description: 'Standard user access',
    color: 'outline',
    permissions: [
      'Browse products',
      'Place orders',
      'Manage own profile',
      'View order history',
      'Add items to wishlist and cart'
    ]
  }
};

export function RoleAssignmentDialog({ open, onOpenChange, user, onSuccess }: RoleAssignmentDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<AppRole | null>(null);
  const { toast } = useToast();

  const currentRoles = user.user_roles.map(r => r.role);
  const userName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.email;

  const handleAddRole = () => {
    if (currentRoles.includes(selectedRole)) {
      toast({
        title: "Role Already Assigned",
        description: `User already has the ${selectedRole} role`,
        variant: "destructive",
      });
      return;
    }
    setShowConfirmation(true);
  };

  const confirmAddRole = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.user_id,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${selectedRole} role to ${userName}`,
      });

      onSuccess();
      setShowConfirmation(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: AppRole) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.user_id)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `Successfully removed ${role} role from ${userName}`,
      });

      onSuccess();
      setRoleToRemove(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Roles for {userName}
            </DialogTitle>
            <DialogDescription>
              Assign or remove roles for this user. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Roles */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Current Roles</h3>
              {currentRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentRoles.map((role) => (
                    <Badge 
                      key={role}
                      variant={roleDescriptions[role].color as any}
                      className="px-3 py-1 gap-2"
                    >
                      {role}
                      <button
                        onClick={() => setRoleToRemove(role)}
                        className="hover:text-destructive"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </div>

            {/* Add New Role */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Add New Role</h3>
              
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User - Standard Access</SelectItem>
                    <SelectItem value="moderator">Moderator - Limited Admin</SelectItem>
                    <SelectItem value="admin">Admin - Operations Manager</SelectItem>
                    <SelectItem value="superadmin">Superadmin - Full Access</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={loading}>
                  Assign Role
                </Button>
              </div>

              {/* Role Details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold capitalize">{selectedRole}</h4>
                  <Badge variant={roleDescriptions[selectedRole].color as any}>
                    {selectedRole}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {roleDescriptions[selectedRole].description}
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Permissions:</p>
                  <ul className="text-sm space-y-1">
                    {roleDescriptions[selectedRole].permissions.map((permission, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Adding Role */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Role Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to assign the <strong>{selectedRole}</strong> role to <strong>{userName}</strong>.
              </p>
              <p className="text-sm">
                {roleDescriptions[selectedRole].description}
              </p>
              {selectedRole === 'superadmin' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-2">
                  <p className="text-sm font-semibold text-destructive">Warning:</p>
                  <p className="text-sm text-destructive">
                    Superadmin role grants full system access including the ability to manage all users and access sensitive data.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddRole} disabled={loading}>
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Removing Role */}
      <AlertDialog open={!!roleToRemove} onOpenChange={() => setRoleToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Role Removal
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                You are about to remove the <strong>{roleToRemove}</strong> role from <strong>{userName}</strong>.
              </p>
              <p className="mt-2 text-sm">
                This will immediately revoke all permissions associated with this role.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => roleToRemove && handleRemoveRole(roleToRemove)} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Removing...' : 'Remove Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
