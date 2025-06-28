"use client";

import { useState } from "react";
import { User } from "better-auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Settings, Palette, Globe, Shield } from "lucide-react";
import ExtensionSettings from "./extension-settings";
import Logo from "@/components/logo";

const settingsItems = [
  {
    title: "Extension Settings",
    icon: Settings,
    id: "extension",
  },
  {
    title: "Appearance",
    icon: Palette,
    id: "appearance",
  },
  {
    title: "Privacy",
    icon: Shield,
    id: "privacy",
  },
  {
    title: "Blocked Websites",
    icon: Globe,
    id: "blocked",
  },
];

export default function SettingsPage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("extension");

  const renderContent = () => {
    switch (activeTab) {
      case "extension":
        return <ExtensionSettings />;
      case "appearance":
        return (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Appearance Settings</h2>
              <p className="text-gray-600 mb-8">Customize the visual appearance of TagXi.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 font-medium">Coming Soon</p>
                <p className="text-blue-700 text-sm mt-1">
                  Appearance customization options will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        );
      case "privacy":
        return (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
              <p className="text-gray-600 mb-8">Control your privacy and data sharing preferences.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 font-medium">Coming Soon</p>
                <p className="text-blue-700 text-sm mt-1">
                  Privacy controls will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        );
      case "blocked":
        return (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Blocked Websites</h2>
              <p className="text-gray-600 mb-8">Manage websites where TagXi should be disabled.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 font-medium">Coming Soon</p>
                <p className="text-blue-700 text-sm mt-1">
                  Website blocking management will be available in a future update.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return <ExtensionSettings />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-100 p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Settings
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        className={`w-full justify-start px-3 py-2.5 text-sm font-medium transition-colors ${
                          activeTab === item.id
                            ? "bg-orange-50 text-orange-700 border-r-2 border-orange-500"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="bg-white">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-6 bg-white">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-gray-50">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}