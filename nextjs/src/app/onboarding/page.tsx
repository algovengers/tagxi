import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import OnboardingPage from "./components/onboarding";
import { redirect } from "next/navigation";

export default async function Onboarding() {
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });

  if (!session?.user) {
    return redirect("/login");
  }

  if (session.user.username) {
    return redirect("/home");
  }

  return <OnboardingPage user={session.user} />;
}
