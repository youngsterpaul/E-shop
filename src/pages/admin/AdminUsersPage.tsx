import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, FileUp, Mail, Phone, ChevronDown, RefreshCw } from 'lucide-react';
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
  
  // Pagination state
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
  
  // Fetch users with their roles
  const fetchUsers = async () => {
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) throw profilesError;

    // Fetch all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');
      
    if (rolesError) throw rolesError;

    // Create a map of user_id to highest role
    const roleMap = new Map<string, AppRole>();
    const roleHierarchy: AppRole[] = ['superadmin', 'admin', 'moderator', 'user'];
    
  userRoles?.forEach(ur => {
    // Add type assertion here
    const role = ur.role as AppRole;
    if (isValidRole(role)) {
      const currentRole = roleMap.get(ur.user_id);
      if (!currentRole || roleHierarchy.indexOf(role) < roleHierarchy.indexOf(currentRole)) {
        roleMap.set(ur.user_id, role);
      }
    }
  });

    // Combine profiles with roles
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
  
  // Apply filtering
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchMatch = searchQuery === '' || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_sign_in_at?.toLowerCase().includes(searchQuery.toLowerCase()) ||  
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const roleMatch = selectedRole === 'All Roles' || 
      (selectedRole === 'Super Admin' && user.role === 'superadmin') ||
      (selectedRole === 'Admin' && user.role === 'admin') ||
      (selectedRole === 'Moderator' && user.role === 'moderator') ||
      (selectedRole === 'User' && user.role === 'user');
    
    return searchMatch && roleMatch;
  });

  // Get users to display (with pagination)
  const displayedUsers = filteredUsers.slice(0, displayedItemsCount);
  const hasMoreUsers = filteredUsers.length > displayedItemsCount;

  // Reset displayed items when filters change
  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
    setSelectedUsers([]);
    setIsAllSelected(false);
  }, [searchQuery, selectedRole, itemsPerPage]);

  // Handle "Show More" button
  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  // Handle "Show All" button
  const handleShowAll = () => {
    setDisplayedItemsCount(filteredUsers.length);
  };

  // Handle "Show Less" button
  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
    document.querySelector('[data-table-container]')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle bulk selection
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map(user => user.user_id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  const toggleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Update isAllSelected based on current selection
  useEffect(() => {
    const displayedUserIds = displayedUsers.map(u => u.user_id);
    const allDisplayedSelected = displayedUserIds.length > 0 && 
      displayedUserIds.every(id => selectedUsers.includes(id));
    setIsAllSelected(allDisplayedSelected);
  }, [selectedUsers, displayedUsers]);
  
  // Handle delete
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
      if (userToDelete !== null) {
        toast({
          title: "User deleted",
          description: "The user has been successfully deleted.",
        });
      } else {
        toast({
          title: "Users deleted",
          description: `${selectedUsers.length} users have been successfully deleted.`,
        });
        setSelectedUsers([]);
      }
      refetch();
    } catch (error: any) {
      console.error('Error deleting users:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRole('All Roles');
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Africa/Nairobi',
    };

    const formatted = new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    return formatted.replace(/\sGMT.*$/, '');
  };

  // Get role display info
  const getRoleInfo = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Super Admin', color: 'bg-purple-600' };
      case 'admin':
        return { label: 'Admin', color: 'bg-blue-500' };
      case 'moderator':
        return { label: 'Moderator', color: 'bg-green-500' };
      case 'user':
      default:
        return { label: 'User', color: 'bg-gray-500' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage your users</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap md:flex-nowrap gap-3">
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => navigate('/supersmartkenyaadmin123/users/add')}
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
            
            <Button 
              variant="outline" 
              disabled={selectedUsers.length === 0}
              onClick={handleBulkDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedUsers.length})
            </Button>

            <Button 
              onClick={() => refetch()}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search users by name or email..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-full md:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card data-table-container>
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Showing {displayedUsers.length} of {filteredUsers.length} users
                  {selectedUsers.length > 0 && (
                    <span className="ml-2 text-green-600 font-medium">
                      • {selectedUsers.length} selected
                    </span>
                  )}
                </CardDescription>
              </div>
              {filteredUsers.length > itemsPerPage && (
                <div className="text-sm text-muted-foreground">
                  {hasMoreUsers ? (
                    <span>{displayedItemsCount} of {filteredUsers.length} shown</span>
                  ) : (
                    <span>All {filteredUsers.length} users shown</span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllSelected && displayedUsers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
                            <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
                          </div>
                        </TableCell>
                        <TableCell><div className="h-5 w-32 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-5 w-16 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-5 w-24 bg-gray-200 animate-pulse rounded" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 w-16 ml-auto bg-gray-200 animate-pulse rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">No users found</p>
                        <Button variant="link" className="mt-2" onClick={resetFilters}>
                          Reset filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedUsers.includes(user.user_id)}
                              onCheckedChange={() => toggleSelectUser(user.user_id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {user.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt={user.first_name || ''} 
                                    className="h-10 w-10 object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="font-semibold text-gray-500">
                                    {user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Unnamed User'}
                                </div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-2" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-2" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleInfo.color}>
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/supersmartkenyaadmin123/users/edit/${user.user_id}`)}
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > itemsPerPage && !isLoading && (
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
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
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
    </div>
  );
};

export default AdminUsersPage;