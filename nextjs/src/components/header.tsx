import Link from "next/link";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <div className="w-full py-8">
      <div className="flex-1 flex flex-row justify-between items-center">
        <div className="font-happy-monkey text-2xl">Tagxi</div>
        <div className="flex flex-row gap-4 items-center text-xl">
          <div>How it works</div>
          <Link href="/login">Log in</Link>
          <Link href="/signup">
            <Button size="lg">Sign up</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
