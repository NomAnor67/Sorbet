import { useState, useEffect } from "react";
import { useBrowserState } from "@/hooks/useBrowserState";
import { useAuth } from "@/hooks/useAuth";
import { schedulePushSettings } from "@/lib/settingsSync";
import Sidebar from "@/components/BrowserSidebar";
import Toolbar from "@/components/BrowserToolbar";
import ContentArea from "@/components/ContentArea";
import StatusBar from "@/components/StatusBar";
import DiscordPopup from "@/components/DiscordPopup";

export default function ArcBrowser() {
  const state = useBrowserState();
  const { user, setUser } = useAuth();
  const splitTab = state.splitTabId
    ? state.tabs.find((t) => t.id === state.splitTabId)
    : undefined;
  const [showNotifications, setShowNotifications] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!user) return;
    const onSync = () => schedulePushSettings();
    window.addEventListener('petezah-settings-updated', onSync);
    window.addEventListener('petezah-sync-request', onSync);
    return () => {
      window.removeEventListener('petezah-settings-updated', onSync);
      window.removeEventListener('petezah-sync-request', onSync);
    };
  }, [user]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { tabId, url } = (e as CustomEvent).detail;
      state.updateTabUrl(tabId, url);
      try {
        const entries = JSON.parse(localStorage.getItem("petezah-history") || "[]");
        const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`;
        const newEntry = { id: String(Date.now()) + Math.random(), url, title: url, favicon, visitedAt: Date.now(), isProxied: true };
        const filtered = entries.filter((entry: any) => entry.url !== url);
        localStorage.setItem("petezah-history", JSON.stringify([newEntry, ...filtered].slice(0, 500)));
        window.dispatchEvent(new CustomEvent('petezah-sync-request'));
      } catch {}
    };
    window.addEventListener("petezah-url-change", handler);
    return () => window.removeEventListener("petezah-url-change", handler);
  }, []);

  return (
    <div style={{ height: "100dvh", width: "100vw", display: "flex", overflow: "hidden", backgroundColor: "hsl(220 30% 7%)" }}>
      <Sidebar
        spaces={state.spaces}
        activeSpaceId={state.activeSpaceId}
        pinnedTabs={state.pinnedTabs}
        unpinnedTabs={state.unpinnedTabs}
        activeTabId={state.activeTabId}
        collapsed={state.sidebarCollapsed}
        onSpaceSwitch={() => {}}
        onTabSelect={state.setActiveTabId}
        onTabClose={state.closeTab}
        onTabPin={state.togglePin}
        onTabSplit={() => state.openSplit()}
        onAddTab={() => state.addTab()}
        onToggleCollapse={() => state.setSidebarCollapsed(!state.sidebarCollapsed)}
        onAccountClick={() => state.navigateToUrl("petezah://account")}
        onNavigate={state.navigateToUrl}
        user={user}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Toolbar
          activeTab={state.activeTab}
          urlInput={state.urlInput}
          isUrlFocused={state.isUrlFocused}
          onUrlChange={state.setUrlInput}
          onUrlFocus={state.setIsUrlFocused}
          onNavigate={state.navigateToUrl}
          onNotificationClick={() => state.navigateToUrl("petezah://account")}
          onCloseTab={() => state.activeTab && state.closeTab(state.activeTab.id)}
          onCloseAllTabs={state.closeAllTabs}
          onNewTab={() => state.addTab()}
          zoomLevel={zoomLevel}
          onZoomIn={() => setZoomLevel((z) => Math.min(z + 10, 200))}
          onZoomOut={() => setZoomLevel((z) => Math.max(z - 10, 50))}
          onResetZoom={() => setZoomLevel(100)}
        />
        <ContentArea
          tabs={state.tabs}
          activeTab={state.activeTab}
          splitTab={splitTab}
          onNavigate={state.navigateToUrl}
          onNewTab={() => state.addTab()}
          onCloseSplit={state.closeSplit}
        />
        <StatusBar
          tabCount={state.tabs.length}
          spaceCount={state.spaces.length}
        />
      </main>
      <DiscordPopup />
    </div>
  );
}