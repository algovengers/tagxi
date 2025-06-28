import React from "react";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import Link from "next/link";

const Hero: React.FC = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-orange-50 overflow-hidden pt-20">
      <div className="absolute inset-0">
        <div className="absolute top-32 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-100/30 to-pink-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center  py-10 justify-between">
        <div className="mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-orange-200/50">
            <Sparkles className="w-4 h-4" />
            <span>Connect friends across the entire web</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight relative mb-8">
          <span className="block drop-shadow-sm">Tag your friends</span>
          <span className="block bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            anywhere and everywhere
          </span>
          <span className="block drop-shadow-sm">on the web.</span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-600  max-w-3xl mx-auto leading-relaxed drop-shadow-sm mb-12">
          Transform any webpage into a social experience. Share discoveries,
          start conversations, and keep your friends in the loop no matter where
          you browse.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-40">
          <Link href={`${backendUrl}/signup`}>
            <button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:shadow-xl flex items-center space-x-2 shadow-lg">
              <span>Start Tagging now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </Link>

          <button className="group border-2 border-gray-300 hover:border-orange-500 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-orange-500 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:shadow-lg flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Watch Demo</span>
          </button>
        </div>
        {/* 
        <div className="mt-16 text-center relative z-40">
          <p className="text-gray-500 text-sm  drop-shadow-sm">
            Trusted by thousands of social web explorers
          </p>
          <div className="flex items-center justify-center space-x-8 opacity-80">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full border-2 border-white shadow-lg"
                ></div>
              ))}
            </div>
            <span className="text-gray-600 font-medium drop-shadow-sm">
              +12,847 active taggers
            </span>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default Hero;