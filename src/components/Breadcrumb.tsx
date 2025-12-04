
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SiteBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const SiteBreadcrumb = ({ items, className }: SiteBreadcrumbProps) => {
  const location = useLocation();
  
  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(
        "flex items-center space-x-2 text-sm text-muted-foreground bg-card p-4 rounded-xl shadow-sm border border-border/50",
        className
      )}
      itemScope 
      itemType="https://schema.org/BreadcrumbList"
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <span 
            itemProp="itemListElement" 
            itemScope 
            itemType="https://schema.org/ListItem"
            className="flex items-center"
          >
            {item.href ? (
              <Link 
                to={item.href} 
                itemProp="item"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                {index === 0 && <Home className="h-4 w-4" />}
                <span itemProp="name" className={index === 0 ? 'sr-only' : ''}>
                  {item.label}
                </span>
              </Link>
            ) : (
              <span 
                itemProp="name" 
                className="font-medium text-foreground"
              >
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </span>
          {index < breadcrumbItems.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default SiteBreadcrumb;
