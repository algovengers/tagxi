"use client";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";
import { useTRPC } from "@/trpc/client";
import { useUploadThing } from "@/utils/uploadthing";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import { AtSign, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { User as UserType } from "@/db/types";

export default function OnboardingPage({ user }: { user: Partial<UserType> }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(user.image ?? null);
  const trpc = useTRPC();
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, routeConfig } = useUploadThing("pfpUploader");

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes
    ),
  });

  const handleUpload = async () => {
    if (files.length > 0) {
      const uploadedFiles = await startUpload(files);
      if (uploadedFiles && uploadedFiles[0]?.ufsUrl) {
        setImage(uploadedFiles[0].ufsUrl); // Set the uploaded image URL
      }
    }
  };

  const { mutate: finishOnboarding, isPending } = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess() {
        router.push("/home");
      },
      onError(error) {
        if (error.data?.code === "UNAUTHORIZED") {
          router.push("/login");
        }
        if (error.data?.code === "FORBIDDEN") {
          router.push("/home");
        }
      },
    })
  );

  return (
    <div>
      <div className="p-8">
        <Logo />
      </div>
      <div className="max-w-xl mx-auto p-4">
        <div className="text-xl font-bold">
          Welcome to Tagxi! Configure your tagxi account!
        </div>
        <div className="my-8 flex flex-col gap-4">
          <div>
            <div>Username</div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                placeholder="johndoe"
              />
            </div>
          </div>

          {!user.name && (
            <div>
              <div>Full Name</div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900 placeholder-gray-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}
          <div className="w-full">
            <div>Upload your cute photo</div>
            <div className="p-2 flex flex-row justify-between items-center border-2 border-gray-200 rounded-md focus:border-primary focus:bg-white transition-all duration-300 outline-none text-gray-900">
              {image && (
                <div>
                  <Image
                    src={image}
                    alt="Profile Picture"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>
              )}
              <div {...getRootProps()}>
                {files.length === 0 && <input {...getInputProps()} />}
                <Button variant="outline" onClick={handleUpload}>
                  {files.length > 0
                    ? `Upload ${files.length} files`
                    : image
                    ? `Update profile picture`
                    : `Choose a profile picture`}
                </Button>
              </div>
            </div>
          </div>
          <Button
            isLoading={isPending}
            onClick={() => finishOnboarding({ username, name })}
            disabled={!username || (!name && !user.name) || !image}
          >
            Finish Onboarding!
          </Button>
        </div>
      </div>
    </div>
  );
}
