"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const trpc = useTRPC();
  const { signUp, signIn } = authClient;
  const router = useRouter();

  const {} = useQuery(
    trpc.hello.queryOptions({
      text: "Hello",
    })
  );

  const { mutate: login, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      const result = await signIn.email({
        email,
        password,
      });
      return result;
    },
    onSuccess: (data) => {
      if (data.data?.user) {
        // Check if user has completed onboarding
        if (data.data.user.username) {
          router.push("/home");
        } else {
          router.push("/onboarding");
        }
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const { mutate: continueWithGoogle, isPending: googlePending } = useMutation({
    mutationKey: ["continueWithGoogle"],
    mutationFn: () => signIn.social({ 
      provider: "google",
      callbackURL: "/home", // Specify callback URL
    }),
    onError: (error) => {
      console.error("Google sign-in error:", error);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login();
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto py-8">
      <h1 className="text-center font-bold text-3xl">Tagxi</h1>
      <div className="relative z-10 w-full max-w-md mt-8 mx-auto">
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email"
                  required
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
                  required
                />
                <button
                  type="button"
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

            <div className="text-right">
              <button 
                type="button"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            
            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-lg"
              isLoading={isPending}
              disabled={!email || !password}
            >
              Sign in
            </Button>
          </div>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="px-4 text-sm text-gray-500">or continue with</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        <Button
          type="button"
          className="w-full flex items-center justify-center py-3 px-4 bg-white/80 rounded-md border-black shadow-none hover:bg-white/70 cursor-pointer"
          onClick={() => continueWithGoogle()}
          isLoading={googlePending}
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
            New to tagxi?{" "}
            <Link
              href="/signup"
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}