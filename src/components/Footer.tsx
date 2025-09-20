import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-600 order-2 md:order-1">
            © 2024 Centsible. All rights reserved.
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm order-1 md:order-2">
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-[#27AE60] transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/terms"
              className="text-gray-600 hover:text-[#27AE60] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Mobile-friendly tagline */}
        <div className="text-center md:text-left mt-4 md:mt-2">
          <p className="text-xs text-gray-500">
            AI-powered budget clarity for your financial peace of mind
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;