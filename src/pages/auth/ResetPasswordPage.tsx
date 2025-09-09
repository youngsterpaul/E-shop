import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PasswordResetHandler } from '@/components/auth/PasswordResetHandler';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { ResetErrorDisplay } from '@/components/auth/ResetErrorDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResetPasswordPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  const SuccessContent = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-medium mb-1">What's next:</p>
        <ul className="space-y-1 text-left">
          <li>• You'll be redirected to the sign-in page shortly</li>
          <li>• Use your email and new password to sign in</li>
          <li>• Consider updating your password manager</li>
        </ul>
      </div>

      <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors">
        <Link to="/auth/signin">
          Continue to Sign In
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          {/* SmartKenya Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">SmartKenya</h1>
          </div>

          <PasswordResetHandler>
            {({ isValidToken, isLoading, errorMessage, hasAuthError }) => {
              if (isLoading) {
                return (
                  <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner />
                    <p className="text-gray-600">Verifying reset link...</p>
                  </div>
                );
              }

              if (errorMessage || hasAuthError) {
                return (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 text-center">
                        Reset Link Issue
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 text-center">
                        There was an issue with your reset link
                      </p>
                    </div>
                    <ResetErrorDisplay errorMessage={errorMessage || 'Invalid reset link'} />
                  </div>
                );
              }

              if (isSuccess) {
                return (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 text-center">
                        Password Reset Complete
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 text-center">
                        Your password has been successfully updated
                      </p>
                    </div>
                    <SuccessContent />
                  </div>
                );
              }

              return (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 text-center">
                      Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      Enter your new password below
                    </p>
                  </div>

                  <PasswordResetForm onSuccess={() => setIsSuccess(true)} />

                  <div className="text-center pt-4">
                    <Link
                      to="/auth/signin"
                      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </div>
                </div>
              );
            }}
          </PasswordResetHandler>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 SmartKenya. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
