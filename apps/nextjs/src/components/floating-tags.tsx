import React from "react";
import FloatingTag from "./floating-tag";

const FloatingTags: React.FC = () => {
  const tags = [
    {
      friend: "sarah_chen",
      message: "Check out this amazing article about sustainable living! 🌱",
      delay: 0,
      duration: 20,
      position: { top: "8%", left: "5%" },
      size: "medium" as const,
      opacity: 0.9,
      imageUrl: "/human-12.jpg",
    },
    {
      friend: "mike_dev",
      message:
        "This coding tutorial is exactly what we needed for our project!",
      delay: 2,
      duration: 25,
      position: { top: "12%", left: "85%" },
      size: "large" as const,
      opacity: 0.8,
      imageUrl: "/human-3.jpg",
    },
    {
      friend: "emma_travel",
      message: "Adding this restaurant to our Tokyo trip list! 🍜",
      delay: 1,
      duration: 18,
      position: { top: "35%", left: "2%" },
      size: "small" as const,
      opacity: 0.7,
      imageUrl: "/human-2.jpg",
    },
    {
      friend: "alex_fitness",
      message: "This workout routine looks intense but doable 💪",
      delay: 3,
      duration: 22,
      position: { top: "8%", left: "70%" },
      size: "medium" as const,
      opacity: 0.9,
      imageUrl: "/human-4.jpg",
    },
    {
      friend: "lisa_food",
      message: "OMG we have to try making this recipe this weekend!",
      delay: 0.5,
      duration: 19,
      position: { top: "75%", left: "80%" },
      size: "large" as const,
      opacity: 0.8,
      imageUrl: "/human-5.jpg",
    },
    {
      friend: "ryan_music",
      message: "This playlist is perfect for our road trip! 🎵",
      delay: 2.5,
      duration: 24,
      position: { top: "35%", left: "82%" },
      size: "small" as const,
      opacity: 0.6,
      imageUrl: "/human-6.jpg",
    },
    {
      friend: "zoe_art",
      message: "The colors in this gallery are absolutely stunning",
      delay: 1.5,
      duration: 21,
      position: { top: "85%", left: "8%" },
      size: "medium" as const,
      opacity: 0.9,
      imageUrl: "/human-7.jpg",
    },
    {
      friend: "jessica_tech",
      message: "This new framework could revolutionize our workflow",
      delay: 4,
      duration: 23,
      position: { top: "50%", left: "12%" },
      size: "large" as const,
      opacity: 0.7,
      imageUrl: "/human-8.jpg",
    },
    {
      friend: "mia_books",
      message: "Adding this to my must-read list! Thanks for sharing 📚",
      delay: 0.8,
      duration: 26,
      position: { top: "15%", left: "15%" },
      size: "small" as const,
      opacity: 0.8,
      imageUrl: "/human-9.jpg",
    },
    {
      friend: "david_photo",
      message: "These photography tips are game-changers! 📸",
      delay: 3.2,
      duration: 20,
      position: { top: "90%", left: "65%" },
      size: "medium" as const,
      opacity: 0.9,
      imageUrl: "/human-10.jpg",
    },
    {
      friend: "nina_design",
      message: "This UI inspiration is exactly what I needed!",
      delay: 1.8,
      duration: 22,
      position: { top: "65%", left: "3%" },
      size: "small" as const,
      opacity: 0.8,
      imageUrl: "/human-11.jpg",
    },
    {
      friend: "carlos_chef",
      message: "Can't wait to try this fusion recipe! 🔥",
      delay: 4.5,
      duration: 24,
      position: { top: "55%", left: "90%" },
      size: "medium" as const,
      opacity: 0.7,
      imageUrl: "/human-1.jpg",
    },
  ];

  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {tags.map((tag, index) => (
        <div key={index} className="pointer-events-auto">
          <FloatingTag {...tag} />
        </div>
      ))}
    </div>
  );
};

export default FloatingTags;
