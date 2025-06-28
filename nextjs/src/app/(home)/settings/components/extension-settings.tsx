"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function ExtensionSettings() {
  const [markerColor, setMarkerColor] = useState("#FF0000");
  const [tagColor, setTagColor] = useState("#ffb988");
  const [newWebsite, setNewWebsite] = useState("");
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);

  const trpc = useTRPC();

  // Fetch current settings
  const { data: settings, refetch } = useQuery(
    trpc.settings.getSettings.queryOptions()
  );

  // Update settings mutation
  const { mutate: updateSettings, isPending } = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    })
  );

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setMarkerColor(settings.markerColor);
      setTagColor(settings.extensionSettings.tag_color);
      setBlockedWebsites(settings.blockedWebsites);
    }
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings({
      markerColor,
      extensionSettings: {
        tag_color: tagColor,
      },
      blockedWebsites,
    });
  };

  const addWebsite = () => {
    if (newWebsite.trim() && !blockedWebsites.includes(newWebsite.trim())) {
      setBlockedWebsites([...blockedWebsites, newWebsite.trim()]);
      setNewWebsite("");
    }
  };

  const removeWebsite = (website: string) => {
    setBlockedWebsites(blockedWebsites.filter((w) => w !== website));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addWebsite();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Extension Settings</h2>
        <p className="text-gray-600">
          Customize how the TagXi extension behaves and appears on websites.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Marker Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Marker Color</CardTitle>
            <CardDescription>
              Choose the color for highlighting tagged content on websites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="marker-color" className="text-sm font-medium">
                  Color:
                </label>
                <input
                  id="marker-color"
                  type="color"
                  value={markerColor}
                  onChange={(e) => setMarkerColor(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Preview:</span>
                <div
                  className="px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: markerColor, color: "#000" }}
                >
                  Tagged text
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tag Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Button Color</CardTitle>
            <CardDescription>
              Customize the appearance of the tag button that appears when you select text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="tag-color" className="text-sm font-medium">
                  Color:
                </label>
                <input
                  id="tag-color"
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Preview:</span>
                <div
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: tagColor }}
                >
                  🔖 Tag
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Websites */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Websites</CardTitle>
            <CardDescription>
              Add websites where the TagXi extension should be disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter website URL (e.g., example.com)"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={addWebsite} size="sm">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            
            {blockedWebsites.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Blocked websites:</p>
                <div className="flex flex-wrap gap-2">
                  {blockedWebsites.map((website) => (
                    <Badge key={website} variant="secondary" className="flex items-center gap-1">
                      {website}
                      <button
                        onClick={() => removeWebsite(website)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}