import React from "react";
import Image from "next/image";

interface FloatingTagProps {
  friend: string;
  message: string;
  delay: number;
  duration: number;
  position: {
    top: string;
    left: string;
  };
  size?: "small" | "medium" | "large";
  opacity?: number;
  variant?: "default" | "heart" | "message";
  imageUrl: string;
}

const FloatingTag: React.FC<FloatingTagProps> = ({
  friend,
  message,
  delay,
  duration,
  position,
  size = "medium",
  opacity = 1,
  imageUrl,
}) => {
  const sizeClasses = {
    small: "w-52 text-xs",
    medium: "w-60 text-sm",
    large: "w-72 text-base",
  };

  return (
    <div
      className={`absolute ${sizeClasses[size]} transform hover:scale-105 transition-all duration-300 cursor-pointer group`}
      style={{
        top: position.top,
        left: position.left,
        opacity,
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 hover:shadow-2xl hover:bg-white transition-all duration-300 group-hover:border-orange-200">
        <div className="flex items-start space-x-3">
          <Image
            src={imageUrl}
            width={35}
            height={35}
            alt=""
            className="rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-200">
              @{friend}
            </p>
            <p className="text-gray-600 mt-1 leading-relaxed group-hover:text-gray-700 transition-colors duration-200">
              {message}
            </p>
          </div>
        </div>
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full animate-pulse shadow-lg"></div>
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
};

export default FloatingTag;
