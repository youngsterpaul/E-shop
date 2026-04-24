import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserRoutePermissions } from '@/hooks/useUserRoutePermissions';
import { useSecurityAlertsCount } from '@/hooks/useSecurityAlertsCount';
import { usePendingOrdersCount } from '@/hooks/usePendingOrdersCount';
import { usePendingReturnsCount } from '@/hooks/usePendingReturnsCount';
import { useUnreadChatCount } from '@/hooks/useUnreadChatCount';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Plus,
  Tags,
  Tag,
  PackageX,
  Store,
  Image,
  MapPin,
  Shield,
  Activity,
  TrendingUp,
  Star,
  Users2,
  Warehouse,
  Truck,
  BarChart3,
  Home,
  Mail,
  FileText,
  DollarSign,
  Zap,
  HelpCircle,
  Phone,
  Lock,
  MessageSquareQuote,
  Newspaper,
  QrCode,
  MessageCircle,
  Eye,
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
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface MenuItem {
  name: string;
  icon: any;
  path: string;
  badge?: string | null;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function ModernAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin, isModerator, loading: rolesLoading } = useUserRole(user?.id);
  const { canAccessRoute, isLoading: permissionsLoading } = useUserRoutePermissions(user?.id);
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const scrollRef = useRef<HTMLDivElement>(null);

  const loading = rolesLoading || permissionsLoading;

  const restoreSidebarScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem('adminSidebarScroll');
    if (!saved) return;
    const top = parseInt(saved, 10) || 0;
    el.scrollTop = top;
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = top;
      }
    });
    window.setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = top;
      }
    }, 120);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    restoreSidebarScroll();

    const onScroll = () => {
      sessionStorage.setItem('adminSidebarScroll', String(el.scrollTop));
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    restoreSidebarScroll();
  }, [location.pathname, loading]);

  // Real-time badge counts
  const securityAlertsCount = useSecurityAlertsCount();
  const pendingOrdersCount = usePendingOrdersCount();
  const pendingReturnsCount = usePendingReturnsCount();
  const unreadChatCount = useUnreadChatCount();

  const mainMenuItems: MenuItem[] = [
    {
      name: 'Home',
      icon: Home,
      path: '/',
      badge: null,
    },
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/supersmartkenyaadmin123',
      badge: null,
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      path: '/supersmartkenyaadmin123/orders',
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null,
      badgeVariant: 'default' as const,
    },
    {
      name: 'QR Scanner',
      icon: QrCode,
      path: '/supersmartkenyaadmin123/qr-scanner',
      badge: null,
    },
    {
      name: 'Discounts',
      icon: Tag,
      path: '/supersmartkenyaadmin123/discounts',
      badge: null,
    },
    {
      name: 'Flash Sales',
      icon: Zap,
      path: '/supersmartkenyaadmin123/flash-sales',
      badge: null,
    },
    {
      name: 'Returns',
      icon: PackageX,
      path: '/supersmartkenyaadmin123/returns',
      badge: pendingReturnsCount > 0 ? String(pendingReturnsCount) : null,
      badgeVariant: 'destructive' as const,
    },
    {
      name: 'Chat',
      icon: MessageCircle,
      path: '/supersmartkenyaadmin123/chat',
      badge: unreadChatCount > 0 ? String(unreadChatCount) : null,
      badgeVariant: 'default' as const,
    },
  ];

  const catalogMenuItems: MenuItem[] = [
    {
      name: 'Products',
      icon: Package,
      path: '/supersmartkenyaadmin123/products',
      badge: null,
    },
    {
      name: 'Reviews',
      icon: Star,
      path: '/supersmartkenyaadmin123/reviews',
      badge: null,
    },
    {
      name: 'Inventory',
      icon: Warehouse,
      path: '/supersmartkenyaadmin123/inventory',
      badge: null,
    },
    {
      name: 'Purchase Orders',
      icon: Truck,
      path: '/supersmartkenyaadmin123/purchase-orders',
      badge: null,
    },
    {
      name: 'Suppliers',
      icon: Users2,
      path: '/supersmartkenyaadmin123/suppliers',
      badge: null,
    },
    {
      name: 'Categories',
      icon: Tags,
      path: '/supersmartkenyaadmin123/categories',
      badge: null,
    },
    {
      name: 'Category Icons',
      icon: Image,
      path: '/supersmartkenyaadmin123/category-icons',
      badge: null,
    },
    {
      name: 'Stores',
      icon: Store,
      path: '/supersmartkenyaadmin123/stores',
      badge: null,
    },
  ];

  const contentMenuItems: MenuItem[] = [
    {
      name: 'Hero Slides',
      icon: Image,
      path: '/supersmartkenyaadmin123/heroslides',
      badge: null,
    },
    {
      name: 'Testimonials',
      icon: MessageSquareQuote,
      path: '/supersmartkenyaadmin123/testimonials',
      badge: null,
    },
    {
      name: 'Newsletter',
      icon: Newspaper,
      path: '/supersmartkenyaadmin123/newsletter',
      badge: null,
    },
    {
      name: 'Careers',
      icon: Users2,
      path: '/supersmartkenyaadmin123/careers',
      badge: null,
    },
    {
      name: 'FAQ',
      icon: HelpCircle,
      path: '/supersmartkenyaadmin123/faq',
      badge: null,
    },
    {
      name: 'Site Content',
      icon: FileText,
      path: '/supersmartkenyaadmin123/site-content',
      badge: null,
    },
  ];

  const managementMenuItems: MenuItem[] = [
    {
      name: 'Users',
      icon: Users,
      path: '/supersmartkenyaadmin123/users',
      badge: null,
    },
    {
      name: 'Customers',
      icon: Users2,
      path: '/supersmartkenyaadmin123/customers',
      badge: null,
    },
    {
      name: 'Locations',
      icon: MapPin,
      path: '/supersmartkenyaadmin123/locations',
      badge: null,
    },
  ];

  const securityMenuItems: MenuItem[] = [
    {
      name: 'Security Alerts',
      icon: Shield,
      path: '/supersmartkenyaadmin123/security-alerts',
      badge: securityAlertsCount > 0 ? String(securityAlertsCount) : null,
      badgeVariant: 'destructive',
    },
    {
      name: 'Login Audit',
      icon: Activity,
      path: '/supersmartkenyaadmin123/login-audit',
      badge: null,
    },
    {
      name: 'Activity Log',
      icon: Activity,
      path: '/supersmartkenyaadmin123/activity-log',
      badge: null,
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      name: 'Settings',
      icon: Settings,
      path: '/supersmartkenyaadmin123/settings',
      badge: null,
    },
    {
      name: 'Route Permissions',
      icon: Lock,
      path: '/supersmartkenyaadmin123/route-permissions',
      badge: null,
    },
    {
      name: 'Contact Settings',
      icon: Phone,
      path: '/supersmartkenyaadmin123/contact',
      badge: null,
    },
    {
      name: 'Email Templates',
      icon: Mail,
      path: '/supersmartkenyaadmin123/email-templates',
      badge: null,
    },
  ];

  const analyticsMenuItems: MenuItem[] = [
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/supersmartkenyaadmin123/analytics',
      badge: null,
    },
    {
      name: 'User Behavior',
      icon: Eye,
      path: '/supersmartkenyaadmin123/user-behavior',
      badge: null,
    },
    {
      name: 'Sales Forecast',
      icon: TrendingUp,
      path: '/supersmartkenyaadmin123/sales-forecast',
      badge: null,
    },
    {
      name: 'Revenue Dashboard',
      icon: DollarSign,
      path: '/supersmartkenyaadmin123/revenue-dashboard',
      badge: null,
    },
    {
      name: 'Reports',
      icon: FileText,
      path: '/supersmartkenyaadmin123/reports',
      badge: null,
    },
    {
      name: 'Daily Sales',
      icon: TrendingUp,
      path: '/supersmartkenyaadmin123/daily-sales',
      badge: null,
    },
    {
      name: 'A/B Testing',
      icon: BarChart3,
      path: '/supersmartkenyaadmin123/ab-testing',
      badge: null,
    },
  ];

  // Filter menu items based on DB permissions
  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      // Home link is always visible
      if (item.path === '/') return true;
      // Use DB-based permission check
      return canAccessRoute(item.path);
    });
  };

  const isMobile = isMobileUserAgent();

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
        <SidebarGroupLabel 
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
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
                    onClick={() => {
                      if (scrollRef.current) {
                        sessionStorage.setItem('adminSidebarScroll', String(scrollRef.current.scrollTop));
                      }
                    }}
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
            {showQuickAction && !collapsed && canAccessRoute('/supersmartkenyaadmin123/products/add') && (
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
      <SidebarContent ref={scrollRef}>
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
