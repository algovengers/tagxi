import React from "react";
import Link from "next/link";
import Logo from "./logo";

const Header: React.FC = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo home={false} />

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={`${backendUrl}/login`}
              className="text-gray-600 hover:text-orange-500 transition-colors duration-200 font-medium"
            >
              Log in
            </Link>
            <Link href={`${backendUrl}/signup`}>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg">
                Sign up
              </button>
            </Link>
          </nav>

          <div className="md:hidden">
            <Link href={`${backendUrl}/signup`}>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200">
                Sign up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;