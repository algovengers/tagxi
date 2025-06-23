import Header from "@/components/landing-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <Header />
      <h1
        className={cn(
          "text-6xl font-bold text-center pt-20 pb-10",
          poppins.className
        )}
      >
        Tag your friends anywhere and everywhere on the web.
      </h1>
      <div className="flex items-center justify-center">
        <Button size="lg">Start Tagging now</Button>
      </div>
    </div>
  );
}
