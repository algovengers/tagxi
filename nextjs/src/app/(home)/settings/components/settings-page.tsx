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
} from "@/components/ui/sidebar";
import { Settings, Palette, Globe, Shield } from "lucide-react";
import ExtensionSettings from "./extension-settings";

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
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Appearance Settings</h2>
            <p className="text-gray-600">Appearance settings coming soon...</p>
          </div>
        );
      case "privacy":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Privacy Settings</h2>
            <p className="text-gray-600">Privacy settings coming soon...</p>
          </div>
        );
      case "blocked":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Blocked Websites</h2>
            <p className="text-gray-600">Blocked websites management coming soon...</p>
          </div>
        );
      default:
        return <ExtensionSettings />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}