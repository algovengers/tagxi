import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });

  if (!session?.user) {
    return redirect("/login");
  }

  if (!session.user.username) {
    return redirect("/onboarding");
  }

  return (
    <div className="max-w-3xl p-4 mx-auto w-full">
      <div>Welcome Home!</div>
      <Link href="/friends">
        <Button>Check your friends</Button>
      </Link>
    </div>
  );
}
