import Image from "next/image";
import Link from "next/link";

export default function Logo({ home = true }: { home?: boolean }) {
  return (
    <Link href={home ? "/home" : "/"}>
      <div className="flex gap-1">
        <Image src="/logo.png" alt="" height={30} width={30} />
        <div className="text-xl font-bold">Tagxi</div>
      </div>
    </Link>
  );
}
