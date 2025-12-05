import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useRoutePermissions, RoutePermission } from '@/hooks/useRoutePermissions';
import { Loader2, Shield, Users, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminRoutePermissionsPage = () => {
  const { permissions, isLoading, updatePermission } = useRoutePermissions();
  const { toast } = useToast();

  const handleToggle = async (id: string, currentValue: boolean, routeName: string, role: string) => {
    try {
      await updatePermission.mutateAsync({ id, is_allowed: !currentValue });
      toast({
        title: 'Permission Updated',
        description: `${routeName} access ${!currentValue ? 'granted to' : 'revoked from'} ${role}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  // Group permissions by route_group
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.route_group]) {
      acc[perm.route_group] = [];
    }
    acc[perm.route_group].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  // Get unique routes per group
  const getUniqueRoutes = (perms: typeof permissions) => {
    const routeMap = new Map<string, { route_path: string; route_name: string; admin?: RoutePermission; moderator?: RoutePermission }>();
    
    perms?.forEach(perm => {
      const existing = routeMap.get(perm.route_path) || { route_path: perm.route_path, route_name: perm.route_name };
      if (perm.role === 'admin') {
        existing.admin = perm;
      } else if (perm.role === 'moderator') {
        existing.moderator = perm;
      }
      routeMap.set(perm.route_path, existing);
    });
    
    return Array.from(routeMap.values());
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const groups = Object.keys(groupedPermissions || {});

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Route Permissions</h1>
          <p className="text-muted-foreground">
            Manage which roles can access specific admin pages. Superadmins always have full access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Superadmin</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Full access to all routes</p>
              <Badge variant="secondary" className="mt-2">All Permissions</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Admin</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configurable access</p>
              <Badge variant="outline" className="mt-2">
                {permissions?.filter(p => p.role === 'admin' && p.is_allowed).length || 0} routes enabled
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Moderator</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configurable access</p>
              <Badge variant="outline" className="mt-2">
                {permissions?.filter(p => p.role === 'moderator' && p.is_allowed).length || 0} routes enabled
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={groups[0]} className="w-full">
          <TabsList className="flex-wrap h-auto gap-1">
            {groups.map(group => (
              <TabsTrigger key={group} value={group} className="text-sm">
                {group}
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.map(group => (
            <TabsContent key={group} value={group}>
              <Card>
                <CardHeader>
                  <CardTitle>{group}</CardTitle>
                  <CardDescription>
                    Configure access to {group.toLowerCase()} related pages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 bg-muted rounded-t-lg text-sm font-medium">
                      <span>Route</span>
                      <span className="text-center">Admin</span>
                      <span className="text-center">Moderator</span>
                    </div>
                    
                    {getUniqueRoutes(groupedPermissions?.[group])?.map(route => (
                      <div 
                        key={route.route_path} 
                        className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-3 border-b last:border-0 items-center hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{route.route_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{route.route_path}</p>
                        </div>
                        <div className="flex justify-center">
                          {route.admin && (
                            <Switch
                              checked={route.admin.is_allowed}
                              onCheckedChange={() => handleToggle(
                                route.admin!.id,
                                route.admin!.is_allowed,
                                route.route_name,
                                'Admin'
                              )}
                              disabled={updatePermission.isPending}
                            />
                          )}
                        </div>
                        <div className="flex justify-center">
                          {route.moderator && (
                            <Switch
                              checked={route.moderator.is_allowed}
                              onCheckedChange={() => handleToggle(
                                route.moderator!.id,
                                route.moderator!.is_allowed,
                                route.route_name,
                                'Moderator'
                              )}
                              disabled={updatePermission.isPending}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminRoutePermissionsPage;
