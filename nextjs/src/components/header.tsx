import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "./ui/button";
import { auth } from "@/lib/auth";

export default async function Header() {
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });
  return (
    <div className="w-full py-8">
      <div className="flex-1 flex flex-row justify-between items-center">
        <div className="font-happy-monkey text-2xl">Tagxi</div>
        <div className="flex flex-row gap-4 items-center text-xl">
          <div>How it works</div>
          {session?.user ? (
            <>
              <Link href="/home">Home</Link>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">
                <Button size="lg">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
