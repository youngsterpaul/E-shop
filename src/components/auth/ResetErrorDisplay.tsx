import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface ResetErrorDisplayProps {
  errorMessage: string;
}

export const ResetErrorDisplay = ({ errorMessage }: ResetErrorDisplayProps) => {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Reset Link Issue</h3>
        <p className="text-sm text-gray-600">There was an issue with your reset link</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2">Reset Link Expired</h4>
        <p className="text-sm text-red-700 mb-3">Invalid or missing reset tokens</p>
        
        <div className="text-xs text-red-600 text-left">
          <p className="font-medium mb-1">What happened:</p>
          <ul className="space-y-1">
            <li>• Password reset links expire after 1 hour for security</li>
            <li>• The link may have already been used</li>
            <li>• You need to request a new password reset</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors">
          <Link to="/auth/forgot-password">
            Request New Reset Link
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="w-full h-12 rounded-lg font-medium">
          <Link to="/auth/signin" className="inline-flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    </div>
  );
};