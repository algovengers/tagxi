import { getFriends } from "@/actions/friends";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Heart } from "lucide-react";
import Link from "next/link";

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

  const friends = await getFriends(session.user.id);

  if (friends.length === 0) {
    return <EmptyFriendsState />;
  }

  return <FriendsGrid friends={friends} />;
}

function EmptyFriendsState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <Users className="w-12 h-12 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">No friends yet</h1>
          <p className="text-gray-600 text-lg">
            Your friend list is empty, but that's about to change!
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Ready to connect?</span>
          </div>
          <p className="text-blue-700 text-sm">
            Start building your network by sending friend requests and
            connecting with others.
          </p>
        </div>
      </div>
    </div>
  );
}

function FriendsGrid({
  friends,
}: {
  friends: Awaited<ReturnType<typeof getFriends>>;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Your Friends</h1>
          <p className="text-gray-600">
            {friends.length} {friends.length === 1 ? "friend" : "friends"} in
            your network
          </p>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          <Heart className="w-4 h-4 mr-1" />
          {friends.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {friends.map((friend) => (
          <FriendCard key={friend.user.username} friend={friend} />
        ))}
      </div>
    </div>
  );
}

function FriendCard({
  friend,
}: {
  friend: Awaited<ReturnType<typeof getFriends>>[number];
}) {
  const user = friend.user;
  const initials = "CN"; // TODO

  return (
    <Link href={`/u/${user.username}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-gray-200 hover:border-gray-300">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-16 h-16 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
              <AvatarImage
                src={user.image ?? "/default-avatar.png"}
                alt={user.username || ""}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-1 w-full">
              <h3
                className="font-semibold text-gray-900 truncate"
                title={user.username}
              >
                {user.username}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Friend</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
