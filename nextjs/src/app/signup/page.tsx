"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignupPage() {
  const [showFields, setShowFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const { signUp, signIn } = authClient;
  const trpc = useTRPC();
  const router = useRouter();

  const { mutate: checkUsername, isPending: checkingUsername } = useMutation(
    trpc.username.checkUsername.mutationOptions({
      onSuccess: (data) => {
        if (data.available) {
          setShowFields(true);
        } else {
          setUsernameError(true);
        }
      },
    })
  );

  // const {} = useMutation({})

  const { mutate: continueWithGoogle, isPending: googlePending } = useMutation({
    mutationKey: ["continueWithGoogle"],
    mutationFn: () => signIn.social({ provider: "google" }),
    onSuccess: () => {
      router.push("/");
    },
  });

  const { mutate: submit, isPending } = useMutation({
    mutationKey: ["signUp"],
    mutationFn: () =>
      signUp.email({
        email,
        username,
        password,
        name,
      }),
    onSuccess: () => {
      router.push("/");
    },
  });

  return (
    <div className="min-h-screen max-w-4xl mx-auto py-8 flex-col flex">
      <h1 className="text-center font-bold text-3xl">Tagxi</h1>
      <div className="relative z-10 w-full max-w-md mt-8 mx-auto h-full py-auto flex-1 flex">
        <div className="my-auto flex-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                  placeholder="Enter your tagxi username"
                  disabled={showFields || checkingUsername}
                />
              </div>
            </div>
            {showFields && (
              <>
                <div className="space-y-2">
                  <div className="relative">
                    <UserPen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                      placeholder="Your Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                      placeholder="Enter your password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button
              size="lg"
              className="w-full text-lg mt-4"
              onClick={() => checkUsername({ username })}
              isLoading={checkingUsername || isPending}
            >
              Sign up
            </Button>
          </div>

          <div className="my-8 flex items-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          <Button
            className="w-full flex items-center justify-center py-3 px-4 bg-white/80 rounded-md border-black shadow-none hover:bg-white/70"
            onClick={() => continueWithGoogle()}
          >
            <Image
              src="/google.svg"
              alt="Continue with google"
              height={20}
              width={20}
            />
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </Button>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
              >
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
