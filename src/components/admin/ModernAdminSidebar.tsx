import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Plus,
  Tags,
  Bell,
  Store,
  Image,
  MapPin,
  Shield,
  Activity,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MenuItem {
  name: string;
  icon: any;
  path: string;
  roles: string[];
  badge?: string | null;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function ModernAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isAdmin, loading } = useUserRole(user?.id);
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const mainMenuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/supersmartkenyaadmin123',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Daily Sales',
      icon: TrendingUp,
      path: '/supersmartkenyaadmin123/daily-sales',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      path: '/supersmartkenyaadmin123/orders',
      roles: ['superadmin'],
      badge: 'New',
      badgeVariant: 'default' as const,
    },
  ];

  const catalogMenuItems = [
    {
      name: 'Products',
      icon: Package,
      path: '/supersmartkenyaadmin123/products',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Categories',
      icon: Tags,
      path: '/supersmartkenyaadmin123/categories',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Stores',
      icon: Store,
      path: '/supersmartkenyaadmin123/stores',
      roles: ['admin'],
      badge: null,
    },
  ];

  const contentMenuItems = [
    {
      name: 'Hero Slides',
      icon: Image,
      path: '/supersmartkenyaadmin123/heroslides',
      roles: ['admin'],
      badge: null,
    },
  ];

  const managementMenuItems = [
    {
      name: 'Users',
      icon: Users,
      path: '/supersmartkenyaadmin123/users',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Locations',
      icon: MapPin,
      path: '/supersmartkenyaadmin123/locations',
      roles: ['superadmin'],
      badge: null,
    },
  ];

  const securityMenuItems: MenuItem[] = [
    {
      name: 'Security Alerts',
      icon: Shield,
      path: '/supersmartkenyaadmin123/security-alerts',
      roles: ['superadmin'],
      badge: '2',
      badgeVariant: 'destructive',
    },
    {
      name: 'Login Audit',
      icon: Activity,
      path: '/supersmartkenyaadmin123/login-audit',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Activity Log',
      icon: Activity,
      path: '/supersmartkenyaadmin123/activity-log',
      roles: ['superadmin'],
      badge: null,
    },
  ];

  const settingsMenuItems = [
    {
      name: 'Settings',
      icon: Settings,
      path: '/supersmartkenyaadmin123/settings',
      roles: ['superadmin'],
      badge: null,
    },
  ];

  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      if (isSuperAdmin) return true;
      if (isAdmin) return item.roles.includes('admin');
      return false;
    });
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (loading) return null;

  const renderMenuGroup = (
    items: MenuItem[],
    label: string,
    showQuickAction = false
  ) => {
    const filtered = filterMenuItems(items);
    if (filtered.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.path)}
                  tooltip={collapsed ? item.name : undefined}
                >
                  <NavLink
                    to={item.path}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                    activeClassName="bg-primary text-primary-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant || 'secondary'} className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {showQuickAction && !collapsed && (
              <SidebarMenuItem>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/supersmartkenyaadmin123/products/add')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {renderMenuGroup(mainMenuItems, 'Overview')}
        <Separator className="my-2" />
        {renderMenuGroup(catalogMenuItems, 'Catalog', true)}
        {renderMenuGroup(contentMenuItems, 'Content')}
        <Separator className="my-2" />
        {renderMenuGroup(managementMenuItems, 'Management')}
        <Separator className="my-2" />
        {renderMenuGroup(securityMenuItems, 'Security')}
        {renderMenuGroup(settingsMenuItems, 'System')}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={collapsed ? 'Logout' : undefined}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <div className="p-4 text-xs text-muted-foreground border-t">
            <p className="font-medium truncate">{user.email}</p>
            <p className="text-[10px] mt-1">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
