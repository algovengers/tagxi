import Header from "@/components/header";
import { cn } from "@/lib/utils";
import { Happy_Monkey } from "next/font/google";

const happyMonkey = Happy_Monkey({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-happy-monkey",
});

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <Header />
      <h1
        className={cn(
          "text-6xl font-bold text-center py-12",
          happyMonkey.className
        )}
      >
        Tag People anywhere and everywhere on the web.
      </h1>
    </div>
  );
}
