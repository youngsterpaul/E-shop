import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityAlertsCount } from '@/hooks/useSecurityAlertsCount';
import { usePendingOrdersCount } from '@/hooks/usePendingOrdersCount';
import { usePendingReturnsCount } from '@/hooks/usePendingReturnsCount';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Plus,
  Tags,
  Tag,
  PackageX,
  Bell,
  Store,
  Image,
  MapPin,
  Shield,
  Activity,
  TrendingUp,
  ChevronRight,
  Star,
  Factory,
  Building2,
  FolderTree,
  PackageSearch,
  Warehouse,
  Truck,
  Users2,
  BarChart3,
  Home,
  Mail,
  FileText,
  DollarSign,
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
  const { isSuperAdmin, isAdmin, isModerator, loading } = useUserRole(user?.id);
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  // Real-time badge counts
  const securityAlertsCount = useSecurityAlertsCount();
  const pendingOrdersCount = usePendingOrdersCount();
  const pendingReturnsCount = usePendingReturnsCount();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const mainMenuItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/',
      roles: ['superadmin', 'admin', 'moderator'],
      badge: null,
    },
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/supersmartkenyaadmin123',
      roles: ['superadmin', 'admin', 'moderator'],
      badge: null,
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/supersmartkenyaadmin123/analytics',
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
      roles: ['superadmin', 'admin', 'moderator'],
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null,
      badgeVariant: 'default' as const,
    },
    {
      name: 'Discounts',
      icon: Tag,
      path: '/supersmartkenyaadmin123/discounts',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Returns',
      icon: PackageX,
      path: '/supersmartkenyaadmin123/returns',
      roles: ['superadmin', 'admin'],
      badge: pendingReturnsCount > 0 ? String(pendingReturnsCount) : null,
      badgeVariant: 'destructive' as const,
    },
  ];

  const catalogMenuItems = [
    {
      name: 'Products',
      icon: Package,
      path: '/supersmartkenyaadmin123/products',
      roles: ['superadmin', 'admin', 'moderator'],
      badge: null,
    },
    {
      name: 'Reviews',
      icon: Star,
      path: '/supersmartkenyaadmin123/reviews',
      roles: ['superadmin', 'admin', 'moderator'],
      badge: null,
    },
    {
      name: 'Inventory',
      icon: Warehouse,
      path: '/supersmartkenyaadmin123/inventory',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Purchase Orders',
      icon: Truck,
      path: '/supersmartkenyaadmin123/purchase-orders',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Suppliers',
      icon: Users2,
      path: '/supersmartkenyaadmin123/suppliers',
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
      roles: ['superadmin', 'admin'],
      badge: null,
    },
  ];

  const contentMenuItems = [
    {
      name: 'Hero Slides',
      icon: Image,
      path: '/supersmartkenyaadmin123/heroslides',
      roles: ['superadmin', 'admin'],
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
      name: 'Customers',
      icon: Users2,
      path: '/supersmartkenyaadmin123/customers',
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
      badge: securityAlertsCount > 0 ? String(securityAlertsCount) : null,
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
    {
      name: 'Email Templates',
      icon: Mail,
      path: '/supersmartkenyaadmin123/email-templates',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
  ];

  const analyticsMenuItems: MenuItem[] = [
    {
      name: 'Analytics',
      icon: TrendingUp,
      path: '/supersmartkenyaadmin123/analytics',
      roles: ['superadmin'],
      badge: null,
    },
    {
      name: 'Revenue Dashboard',
      icon: DollarSign,
      path: '/supersmartkenyaadmin123/revenue-dashboard',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Reports',
      icon: FileText,
      path: '/supersmartkenyaadmin123/reports',
      roles: ['superadmin', 'admin'],
      badge: null,
    },
    {
      name: 'Daily Sales',
      icon: Activity,
      path: '/supersmartkenyaadmin123/daily-sales',
      roles: ['superadmin'],
      badge: null,
    },
  ];

  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      if (isSuperAdmin) return true;
      if (isAdmin) return item.roles.includes('superadmin') || item.roles.includes('admin');
      if (isModerator) return item.roles.includes('superadmin') || item.roles.includes('admin') || item.roles.includes('moderator');
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
        {renderMenuGroup(analyticsMenuItems, 'Analytics')}
        <Separator className="my-2" />
        {renderMenuGroup(securityMenuItems, 'Security')}
        {renderMenuGroup(settingsMenuItems, 'System')}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && user && (
          <div className="p-4 text-xs text-muted-foreground border-t">
            <p className="font-medium truncate">{user.email}</p>
            <p className="text-[10px] mt-1">
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'User'}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
