import Logo from "@/components/logo";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
    <div>
      <div className="p-8">
        <Logo />
      </div>
      <div>Welcome Home!</div>
    </div>
  );
}
