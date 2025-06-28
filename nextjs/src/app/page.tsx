import FloatingTags from "@/components/floating-tags";
import Hero from "@/components/hero";
import Header from "@/components/landing-header";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative h-screen">
      <Header />
      <FloatingTags />
      <Hero />
      <Link href="https://bolt.new" className="absolute right-5 bottom-20 md:right-20 md:bottom-10 z-50">
        <Image src="/bolt.png" height={50} width={50} alt="Built with bolt" />
      </Link>
    </div>
  );
}
