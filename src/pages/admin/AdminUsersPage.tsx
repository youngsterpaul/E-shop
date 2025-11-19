import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { EmptyState } from '@/components/admin/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Edit, Trash2, Mail, Phone, ChevronDown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppRole } from '@/hooks/useUserRole';

interface User {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  role: AppRole;
}

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(10);
  
  const roles = [
    "All Roles",
    "Super Admin",
    "Admin",
    "Moderator",
    "User",
  ];

  const isValidRole = (role: string): role is AppRole => {
    return ['superadmin', 'admin', 'moderator', 'user'].includes(role);
  };
  
  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) throw profilesError;

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
      
    if (rolesError) throw rolesError;

    const roleMap = new Map<string, AppRole>();
    const roleHierarchy: AppRole[] = ['superadmin', 'admin', 'moderator', 'user'];
    
    userRoles?.forEach(ur => {
      const role = ur.role as AppRole;
      if (isValidRole(role)) {
        const currentRole = roleMap.get(ur.user_id);
        if (!currentRole || roleHierarchy.indexOf(role) < roleHierarchy.indexOf(currentRole)) {
          roleMap.set(ur.user_id, role);
        }
      }
    });

    const usersWithRoles: User[] = profiles.map(profile => ({
      ...profile,
      role: roleMap.get(profile.user_id) || 'user'
    }));

    return usersWithRoles;
  };
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers
  });
  
  const filteredUsers = users.filter(user => {
    const searchMatch = searchQuery === '' || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const roleMatch = selectedRole === 'All Roles' || 
      getRoleName(user.role).includes(selectedRole.replace(' Admin', 'admin').replace('User', 'user'));

    return searchMatch && roleMatch;
  });

  const displayedUsers = filteredUsers.slice(0, displayedItemsCount);
  const hasMoreUsers = filteredUsers.length > displayedItemsCount;

  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
    setSelectedUsers([]);
    setIsAllSelected(false);
  }, [searchQuery, selectedRole, itemsPerPage]);

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(filteredUsers.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
  };

  const handleEdit = (userId: string) => {
    navigate(`/supersmartkenyaadmin123/users/edit/${userId}`);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setUserToDelete(null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (userToDelete) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userToDelete);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } else {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .in('user_id', selectedUsers);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${selectedUsers.length} users deleted successfully`,
        });

        setSelectedUsers([]);
        setIsAllSelected(false);
      }

      refetch();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', selectedUsers);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedUsers.length} users deleted successfully`,
      });

      setSelectedUsers([]);
      setIsAllSelected(false);
      refetch();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
      setIsAllSelected(false);
    } else {
      setSelectedUsers(displayedUsers.map(u => u.user_id));
      setIsAllSelected(true);
    }
  };

  const handleSelectAll = () => {
    setSelectedUsers(displayedUsers.map(u => u.user_id));
    setIsAllSelected(true);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
    setIsAllSelected(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'moderator': 'Moderator',
      'user': 'User'
    };
    return roleMap[role] || 'User';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-500';
      case 'admin':
        return 'bg-blue-500';
      case 'moderator':
        return 'bg-green-500';
      case 'user':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Users"
        onRefresh={() => refetch()}
        addNewPath="/supersmartkenyaadmin123/users/add"
        addNewLabel="Add User"
      />

      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredUsers}
          filename="users"
          headers={[
            { key: 'email', label: 'Email' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'role', label: 'Role' },
            { key: 'created_at', label: 'Created At' },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={searchQuery || selectedRole !== 'All Roles'
                ? "Try adjusting your filters"
                : "Get started by adding your first user"
              }
              actionLabel="Add User"
              onAction={() => navigate('/supersmartkenyaadmin123/users/add')}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={isAllSelected && displayedUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={() => toggleUserSelection(user.user_id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {user.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {user.phone}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString() 
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(user.user_id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(user.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-6 border-t bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    {hasMoreUsers && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleShowMore}
                          className="flex items-center gap-2"
                        >
                          <ChevronDown className="h-4 w-4" />
                          Show More ({Math.min(itemsPerPage, filteredUsers.length - displayedItemsCount)} more)
                        </Button>
                        
                        {filteredUsers.length - displayedItemsCount > itemsPerPage && (
                          <Button 
                            variant="ghost" 
                            onClick={handleShowAll}
                            className="text-green-600 hover:text-green-700"
                          >
                            Show All ({filteredUsers.length})
                          </Button>
                        )}
                      </>
                    )}
                    
                    {!hasMoreUsers && displayedItemsCount > itemsPerPage && (
                      <Button 
                        variant="outline" 
                        onClick={handleShowLess}
                        className="flex items-center gap-2"
                      >
                        Show Less
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BulkActionsBar
        selectedCount={selectedUsers.length}
        totalCount={displayedUsers.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleBulkDelete}
        onExport={() => {
          const selected = displayedUsers.filter(u => selectedUsers.includes(u.user_id));
          const csv = [
            ['Email', 'Name', 'Phone', 'Role'].join(','),
            ...selected.map(u => [u.email, `${u.first_name} ${u.last_name}`, u.phone, u.role].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'selected-users.csv';
          a.click();
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {userToDelete === null
                ? `Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`
                : "Are you sure you want to delete this user? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsersPage;
