import React from "react";
import Link from "next/link";
import Logo from "./logo";

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo home={false} />

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/login"
              className="text-gray-600 hover:text-orange-500 transition-colors duration-200 font-medium"
            >
              Log in
            </Link>
            <Link href="/signup">
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg">
                Sign up
              </button>
            </Link>
          </nav>

          <div className="md:hidden">
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
