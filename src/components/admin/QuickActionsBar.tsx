import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsBarProps {
  title: string;
  onRefresh?: () => void;
  onSearch?: () => void;
  addNewPath?: string;
  addNewLabel?: string;
  onExport?: () => void;
  onImport?: () => void;
  customActions?: React.ReactNode;
}

export function QuickActionsBar({
  title,
  onRefresh,
  onSearch,
  addNewPath,
  addNewLabel = 'Add New',
  onExport,
  onImport,
  customActions,
}: QuickActionsBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and organize your {title.toLowerCase()}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {onSearch && (
          <Button variant="outline" size="sm" onClick={onSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        )}
        
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
        
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        
        {customActions}
        
        {addNewPath && (
          <Button size="sm" onClick={() => navigate(addNewPath)}>
            <Plus className="h-4 w-4 mr-2" />
            {addNewLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
