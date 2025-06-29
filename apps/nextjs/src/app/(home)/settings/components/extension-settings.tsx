"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Check, Settings } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function ExtensionSettings() {
  const [tagColor, setTagColor] = useState("#ffb988");
  const [newWebsite, setNewWebsite] = useState("");
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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
        setHasChanges(false);
      },
    })
  );

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setTagColor(settings.extensionSettings.tag_color);
      setBlockedWebsites(settings.blockedWebsites);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const hasColorChanges = tagColor !== settings.extensionSettings.tag_color;
      const hasWebsiteChanges = 
        JSON.stringify(blockedWebsites) !== JSON.stringify(settings.blockedWebsites);
      setHasChanges(hasColorChanges || hasWebsiteChanges);
    }
  }, [tagColor, blockedWebsites, settings]);

  const handleSaveSettings = () => {
    updateSettings({
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Settings className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Extension Settings</h2>
          <p className="text-gray-600">
            Customize how the TagXi extension behaves and appears on websites.
          </p>
        </div>
      </div>

      {/* Tag Color Settings */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-gray-900">Tag Color</CardTitle>
          <CardDescription className="text-gray-600">
            Choose the color for highlighting tagged content on websites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label htmlFor="tag-color" className="text-sm font-medium text-gray-700">
                Color:
              </label>
              <div className="relative">
                <input
                  id="tag-color"
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Preview:</span>
              <div
                className="px-3 py-2 rounded-md text-sm font-medium border"
                style={{ 
                  backgroundColor: tagColor, 
                  color: "#000",
                  borderColor: tagColor
                }}
              >
                Tagged text example
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Websites */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-gray-900">Blocked Websites</CardTitle>
          <CardDescription className="text-gray-600">
            Add websites where the TagXi extension should be disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter website URL (e.g., example.com)"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10"
            />
            <Button 
              onClick={addWebsite} 
              size="sm" 
              className="h-10 px-4 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          
          {blockedWebsites.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Blocked websites:</p>
              <div className="flex flex-wrap gap-2">
                {blockedWebsites.map((website) => (
                  <Badge 
                    key={website} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <span>{website}</span>
                    <button
                      onClick={() => removeWebsite(website)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
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
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button 
          onClick={handleSaveSettings} 
          disabled={isPending || !hasChanges}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Settings
            </>
          ) : (
            "No Changes"
          )}
        </Button>
      </div>
    </div>
  );
}