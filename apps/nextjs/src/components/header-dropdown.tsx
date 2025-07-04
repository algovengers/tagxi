"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { authClient } from "@/lib/auth-client";
import { User as BetterAuthUser } from "better-auth";
import Link from "next/link";

export default function HeaderDropdown({
  children,
  user,
}: {
  children: React.ReactNode;
  user: BetterAuthUser;
}) {
  const auth = authClient;
  const onClick = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200">
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white shadow-lg rounded-md">
        <DropdownMenuLabel className="font-semibold text-gray-700 flex flex-row gap-2">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">@{user.username}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className=" hover:bg-gray-100 cursor-pointer flex flex-row gap-1 items-center">
          <User />
          Profile
        </DropdownMenuItem>
        <Link href="/settings">
          <DropdownMenuItem className=" hover:bg-gray-100 cursor-pointer flex flex-row gap-1 items-center">
            <Settings />
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          className="hover:bg-gray-100 cursor-pointer flex flex-row gap-1 items-center"
          onClick={onClick}
        >
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}