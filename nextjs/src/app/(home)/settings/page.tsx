import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsPage from "./components/settings-page";

export default async function Settings() {
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

  return <SettingsPage user={session.user} />;
}