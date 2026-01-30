"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function BoardCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Fetch API token on mount
  useEffect(() => {
    async function fetchToken() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("api_token")
        .eq("id", user.id)
        .single();

      if (data) {
        setApiToken(data.api_token);
      }
    }
    fetchToken();
  }, [supabase]);

  const saveBoard = useCallback(
    async (editorInstance: Editor) => {
      setSaveStatus("saving");
      try {
        const snapshot = editorInstance.getSnapshot();

        // Export canvas to PNG
        const allShapeIds = [...editorInstance.getCurrentPageShapeIds()];
        let snapshotBlob: Blob | null = null;

        if (allShapeIds.length > 0) {
          try {
            const result = await editorInstance.toImage(allShapeIds, {
              format: "png",
              background: true,
              scale: 2,
              padding: 64,
            });
            snapshotBlob = result.blob;
          } catch {
            // Export failed — save snapshot JSON anyway
          }
        }

        // Upload snapshot image if available
        let snapshotUrl: string | null = null;
        if (snapshotBlob) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const filePath = `${user.id}/board-snapshot.png`;
            const { error: uploadError } = await supabase.storage
              .from("snapshots")
              .upload(filePath, snapshotBlob, {
                cacheControl: "60",
                upsert: true,
                contentType: "image/png",
              });

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("snapshots").getPublicUrl(filePath);
              snapshotUrl = publicUrl;
            }
          }
        }

        // Save to API
        const res = await fetch("/api/board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot,
            snapshot_url: snapshotUrl,
          }),
        });

        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [supabase]
  );

  const handleMount = useCallback(
    (editorInstance: Editor) => {
      setEditor(editorInstance);

      // Load existing board data
      async function loadBoard() {
        try {
          const res = await fetch("/api/board");
          if (res.ok) {
            const data = await res.json();
            if (data.snapshot) {
              editorInstance.loadSnapshot(data.snapshot);
            }
          }
        } catch {
          // No existing board — start fresh
        }
      }

      loadBoard();

      // Listen for changes and auto-save with debounce
      const removeListener = editorInstance.store.listen(
        () => {
          setSaveStatus("unsaved");
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            saveBoard(editorInstance);
          }, 3000);
        },
        { source: "user", scope: "document" }
      );

      return () => {
        removeListener();
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    },
    [saveBoard]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleManualSave = () => {
    if (editor) {
      saveBoard(editor);
    }
  };

  const statusColor: Record<SaveStatus, string> = {
    saved: "bg-green-100 text-green-800",
    saving: "bg-yellow-100 text-yellow-800",
    unsaved: "bg-orange-100 text-orange-800",
    error: "bg-red-100 text-red-800",
  };

  const statusText: Record<SaveStatus, string> = {
    saved: "Saved",
    saving: "Saving...",
    unsaved: "Unsaved",
    error: "Save failed",
  };

  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Freeform</h1>
          <Badge variant="outline" className={statusColor[saveStatus]}>
            {statusText[saveStatus]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {apiToken && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
              >
                API Token
              </Button>
              {showToken && (
                <code
                  className="max-w-[200px] cursor-pointer truncate rounded bg-muted px-2 py-1 text-xs"
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText(apiToken);
                  }}
                >
                  {apiToken}
                </code>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleManualSave}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="relative flex-1">
        <Tldraw
          licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
          onMount={handleMount}
        />
      </div>
    </div>
  );
}
