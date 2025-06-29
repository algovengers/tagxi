import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TagxiHomepage from "./components/home-page";
import { createServerClient } from "@/trpc/server";

export default async function Page() {
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

  const serverClient = await createServerClient({ session });

  const tags = await serverClient.tag.getTagged();

  return <TagxiHomepage tags={tags} />;
}
