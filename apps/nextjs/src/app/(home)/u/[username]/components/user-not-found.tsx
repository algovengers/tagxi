import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="max-w-xl w-full mx-auto h-full flex flex-col flex-1 items-center justify-center gap-4">
      <div className="text-2xl font-semibold">User not found</div>
      <Link href="/home">
        <Button variant="secondary">Go Home</Button>
      </Link>
    </div>
  );
}
