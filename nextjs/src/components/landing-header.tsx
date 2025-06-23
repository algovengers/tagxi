import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "./ui/button";
import { auth } from "@/lib/auth";
import Logo from "./logo";

export default async function Header() {
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });
  return (
    <div className="w-full p-4 rounded-b-3xl bg-white">
      <div className="flex-1 flex flex-row justify-between items-center">
        <Logo />
        <div className="flex flex-row gap-4 items-center text-xl">
          <div>How it works</div>
          {session?.user ? (
            <>
              <Link href="/home">Home</Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Log in
                </Button>
              </Link>
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
