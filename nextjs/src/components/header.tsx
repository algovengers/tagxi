import Logo from "./logo";
import { Input } from "./ui/input";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { Bell } from "lucide-react";
import HeaderDropdown from "./header-dropdown";

export default async function Header() {
  const header = await headers();
  const session = await auth.api.getSession({
    headers: header,
  });
  // should be there always
  const user = session!.user;

  return (
    <div className="w-full p-4 flex flex-row justify-between bg-white items-center">
      <Logo />
      <Input placeholder="Search" className="max-w-xl" />
      <div className="flex flex-row gap-8 items-center">
        <Bell size={20} />
        <div className="flex flex-row gap-2 items-center">
          <HeaderDropdown user={user}>
            <Image
              src={user.image ?? "/default-avatar.png"}
              alt="User Avatar"
              width={30}
              height={30}
              className="rounded-full"
            />
          </HeaderDropdown>
        </div>
      </div>
    </div>
  );
}
