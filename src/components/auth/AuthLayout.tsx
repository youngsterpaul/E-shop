
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-orange-600">SmartKenya</h1>
            </Link>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="bg-white">
            {children}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to SmartKenya
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Brand/Image (Desktop only) */}
      <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Welcome to SmartKenya</h2>
            <p className="text-xl text-orange-100 mb-8">
              Your trusted destination for quality electronics and gadgets
            </p>
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-orange-100">Fast & secure delivery</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-orange-100">Best prices guaranteed</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-orange-100">24/7 customer support</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-orange-100">Trusted by thousands</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
