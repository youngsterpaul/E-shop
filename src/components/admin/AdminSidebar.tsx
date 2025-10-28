import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Plus,
  Tags,
  Bell,
  Store,
  Image
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isAdmin, loading } = useUserRole(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  const allMenuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/supersmartkenyaadmin123',
      roles: ['superadmin'], // Only superadmin
    },
    {
      name: 'Daily Sales',
      icon: Bell,
      path: '/supersmartkenyaadmin123/daily-sales',
      roles: ['superadmin'],
    },
    {
      name: 'Products',
      icon: Package,
      path: '/supersmartkenyaadmin123/products',
      roles: ['superadmin', 'admin'], // Both can access
      action: {
        name: 'Add Product',
        icon: Plus,
        path: '/supersmartkenyaadmin123/products/add',
      },
    },
    {
      name: 'Categories',
      icon: Tags,
      path: '/supersmartkenyaadmin123/categories',
      roles: ['superadmin'],
    },
    {
      name: 'Stores',
      icon: Store,
      path: '/supersmartkenyaadmin123/stores',
      roles: ['superadmin'],
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      path: '/supersmartkenyaadmin123/orders',
      roles: ['superadmin'],
    },
    {
      name: 'Users',
      icon: Users,
      path: '/supersmartkenyaadmin123/users',
      roles: ['superadmin'],
    },
    {
      name: 'HeroSlides',
      icon: Image,
      path: '/supersmartkenyaadmin123/heroslides',
      roles: ['superadmin'],
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/supersmartkenyaadmin123/settings',
      roles: ['superadmin'],
    },
  ];
  
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (isSuperAdmin) return true; // Superadmin sees everything
    if (isAdmin) return item.roles.includes('admin'); // Admin only sees items with 'admin' role
    return false;
  });
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (loading) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-md shadow-md"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 shadow-md z-20 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex h-16 items-center px-3 border-b">
            <h2 className="text-xl font-bold text-green-600">SmartKenya Admin</h2>
          </div>
          
          {/* Role Badge */}
          <div className="px-4 pt-3 pb-2">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              isSuperAdmin 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-green-100 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </div>
                  {item.action && <ChevronRight className="h-4 w-4" />}
                </Link>
                
                {item.action && isActive(item.path) && (
                  <Link
                    to={item.action.path}
                    className="flex items-center px-3 py-2 pl-10 rounded-md text-sm transition-colors hover:bg-gray-100 mt-1"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.action.icon className="h-4 w-4 mr-2" />
                    <span>{item.action.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.email && user.email[0].toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-500">
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Link
                to="/"
                className="flex-1 px-3 py-2 text-center text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                View Site
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;