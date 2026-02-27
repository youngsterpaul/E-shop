import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 max-w-sm"
        >

          {/* 404 number */}
          <div className="relative select-none">
            <span className="text-[120px] font-black text-gray-100 leading-none tracking-tighter">
              404
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-gray-800 tracking-tight">
              Page not found
            </span>
          </div>

          {/* Divider */}
          <div className="w-10 h-1 rounded-full bg-green-500" />

          {/* Message */}
          <p className="text-gray-400 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* CTA */}
          <button
            onClick={() => navigate("/")}
            className="mt-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-semibold px-7 py-3 rounded-lg transition-all duration-150"
          >
            Back to Home
          </button>

          {/* Help link */}
          <p className="text-xs text-gray-300">
            Need help?{" "}
            <button
              onClick={() => navigate("/contact")}
              className="text-green-500 hover:underline font-medium"
            >
              Contact us
            </button>
          </p>

        </motion.div>
      </main>

    </div>
  );
};

export default NotFound;