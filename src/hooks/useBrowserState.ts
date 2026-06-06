import { useState, useCallback } from "react";

export interface ScramjetFrame {
  frame: HTMLIFrameElement;
  back?: () => void;
  forward?: () => void;
  reload?: () => void;
  go?: (url: string) => void;
  destroy?: () => void;
  addEventListener?: (event: string, handler: (e: any) => void) => void;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned?: boolean;
  spaceId: string;
  icon?: string;
  frame?: ScramjetFrame;
}

export interface Space {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_SPACES: Space[] = [
  { id: "main", name: "Home", color: "var(--space-blue)" },
];

let tabCounter = 1;

function getFavicon(url: string): string {
  try {
    if (
      !url ||
      url === "petezah://newtab" ||
      url === "about:blank" ||
      url === "https://"
    )
      return "";
    const clean = url.startsWith("http") ? url : `https://${url}`;
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
      clean
    )}&size=32`;
  } catch {
    return "";
  }
}

function formatUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "petezah://newtab";
  if (trimmed.startsWith("petezah://")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" "))
    return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

function makeScramjetFrame(url: string): ScramjetFrame | undefined {
  const scramjet = (window as any).scramjet;
  if (!scramjet) {
    console.warn("[browser] Scramjet not ready yet, frame creation skipped");
    return undefined;
  }
  try {
    const scFrame = scramjet.createFrame();
    scFrame.frame.src = scramjet.encodeUrl(url);
    scFrame.frame.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;border:none;opacity:0;transition:opacity 0.25s ease;";
    scFrame.frame.onload = () => {
      scFrame.frame.style.opacity = "1";
    };
    return scFrame;
  } catch (e) {
    console.error("Failed to create scramjet frame:", e);
    return undefined;
  }
}

function createTab(url: string, spaceId: string): Tab {
  const tabId = String(tabCounter++);
  const isNewTab = !url || url === "petezah://newtab" || url === "about:blank";
  const finalUrl = isNewTab ? "petezah://newtab" : url;
  const frame = isNewTab ? undefined : makeScramjetFrame(url);
  if (frame) {
    frame.addEventListener?.("urlchange", (e: any) => {
      const newUrl = e?.url || e?.detail?.url || "";
      if (newUrl && newUrl.startsWith("http")) {
        window.dispatchEvent(new CustomEvent("petezah-url-change", {
          detail: { tabId: tabId, url: newUrl }
        }));
      }
    });
  }
  return {
    id: tabId,
    title: isNewTab ? "New Tab" : url.split("/")[2] || url,
    url: finalUrl,
    favicon: getFavicon(finalUrl),
    spaceId,
    frame,
  };
}

function makeNewTabEntry(spaceId: string): Tab {
  return {
    id: String(tabCounter++),
    title: "New Tab",
    url: "petezah://newtab",
    spaceId,
  };
}

export function useBrowserState() {
  const [spaces] = useState<Space[]>(DEFAULT_SPACES);
  const [activeSpaceId] = useState("main");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  const [tabs, setTabs] = useState<Tab[]>(() => {
    const initialTab = makeNewTabEntry("main");
    return [initialTab];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    return String(tabCounter - 1);
  });

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const spaceTabs = tabs.filter((t) => t.spaceId === activeSpaceId);
  const pinnedTabs = spaceTabs.filter((t) => t.pinned);
  const unpinnedTabs = spaceTabs.filter((t) => !t.pinned);

  // ── Add a new tab (optionally with a URL) ──────────────────────────────────
  const addTab = useCallback(
    (url?: unknown) => {
      const targetUrl =
        typeof url === "string" && url.trim() ? url : "petezah://newtab";
      const newTab = createTab(targetUrl, activeSpaceId);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      return newTab;
    },
    [activeSpaceId]
  );

  // ── Close a tab ────────────────────────────────────────────────────────────
  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const tab = prev.find((t) => t.id === id);
        if (tab?.frame) {
          try {
            tab.frame.frame?.parentNode?.removeChild(tab.frame.frame);
            tab.frame.destroy?.();
          } catch {}
        }
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const fallback = makeNewTabEntry(activeSpaceId);
          setTimeout(() => setActiveTabId(fallback.id), 0);
          return [fallback];
        }
        if (id === activeTabId) {
          const idx = prev.findIndex((t) => t.id === id);
          const nextActive = next[Math.min(idx, next.length - 1)];
          setTimeout(() => setActiveTabId(nextActive.id), 0);
        }
        return next;
      });
      setSplitTabId((prev) => (prev === id ? null : prev));
    },
    [activeTabId, activeSpaceId]
  );

  // ── Close all tabs ─────────────────────────────────────────────────────────
  const closeAllTabs = useCallback(() => {
    setTabs((prev) => {
      prev.forEach((tab) => {
        try {
          tab.frame?.frame?.parentNode?.removeChild(tab.frame.frame);
          tab.frame?.destroy?.();
        } catch {}
      });
      const fallback = makeNewTabEntry(activeSpaceId);
      setTimeout(() => setActiveTabId(fallback.id), 0);
      return [fallback];
    });
    setSplitTabId(null);
  }, [activeSpaceId]);

  // ── Pin / unpin a tab ──────────────────────────────────────────────────────
  const togglePin = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  }, []);

  // ── Open a split pane with a fresh new tab ─────────────────────────────────
  const openSplit = useCallback(() => {
    const newTab = makeNewTabEntry(activeSpaceId);
    setTabs((prev) => [...prev, newTab]);
    setSplitTabId(newTab.id);
  }, [activeSpaceId]);

  // ── Close / toggle split pane ──────────────────────────────────────────────
  const closeSplit = useCallback(() => setSplitTabId(null), []);

  // ── Navigate the active tab to a URL ──────────────────────────────────────
  const navigateToUrl = useCallback(
  (rawUrl: unknown) => {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) return;
    const url = formatUrl(rawUrl);

    const doNavigate = () => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;

          if (url === "petezah://newtab" || url.startsWith("petezah://")) {
            try {
              t.frame?.frame?.parentNode?.removeChild(t.frame.frame);
              t.frame?.destroy?.();
            } catch {}
            const title = url === "petezah://newtab" ? "New Tab" : url.replace("petezah://", "").replace(/^\w/, (c) => c.toUpperCase());
            return { ...t, url, title, favicon: "", frame: undefined };
          }

          if (t.frame?.go) {
            try { t.frame.go(url); } catch {}
            const existingTabId = t.id;
            t.frame.addEventListener?.("urlchange", (e: any) => {
              const newUrl = e?.url || e?.detail?.url || "";
              if (newUrl && newUrl.startsWith("http")) {
                window.dispatchEvent(new CustomEvent("petezah-url-change", {
                  detail: { tabId: existingTabId, url: newUrl }
                }));
              }
            });
            return { ...t, url, title: url.split("/")[2] || url, favicon: getFavicon(url) };
          }

          const frame = makeScramjetFrame(url);
          if (frame) {
            const newTabId = t.id;
            frame.addEventListener?.("urlchange", (e: any) => {
              const newUrl = e?.url || e?.detail?.url || "";
              if (newUrl && newUrl.startsWith("http")) {
                window.dispatchEvent(new CustomEvent("petezah-url-change", {
                  detail: { tabId: newTabId, url: newUrl }
                }));
              }
            });
          }
          return {
            ...t,
            url,
            title: url.split("/")[2] || url,
            favicon: getFavicon(url),
            ...(frame ? { frame } : {}),
          };
        })
      );
    };

    // If scramjet isn't ready yet, wait for it
    if (!(window as any).scramjet) {
      const interval = setInterval(() => {
        if ((window as any).scramjet) {
          clearInterval(interval);
          doNavigate();
        }
      }, 100);
    } else {
      doNavigate();
    }

    setUrlInput("");
    setIsUrlFocused(false);
  },
  [activeTabId]
);

  const updateTabMeta = useCallback(
    (id: string, updates: Partial<Pick<Tab, "title" | "url" | "favicon">>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const updateTabUrl = useCallback((tabId: string, url: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, url, favicon: getFavicon(url) } : t))
    );
    setActiveTabId((prev) => {
      if (prev === tabId) setUrlInput(url);
      return prev;
    });
  }, []);

  return {
    spaces,
    tabs,
    activeTabId,
    activeSpaceId,
    activeTab,
    pinnedTabs,
    unpinnedTabs,
    sidebarCollapsed,
    splitTabId,
    urlInput,
    isUrlFocused,
    setActiveTabId,
    setSidebarCollapsed,
    setUrlInput,
    setIsUrlFocused,
    addTab,
    closeTab,
    closeAllTabs,
    togglePin,
    openSplit,
    closeSplit,
    setSplitTabId,
    navigateToUrl,
    updateTabMeta,
    updateTabUrl,
  };
}
