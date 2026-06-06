import { motion } from "framer-motion";
import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  User,
  History,
  Bookmark,
  Puzzle,
  Command,
  Bot,
  Music,
  Film,
  Gamepad2,
  AppWindow,
  MessageCircle,
} from "lucide-react";
import { TabList } from "@/components/TabItem";
import { Tab, Space } from "@/hooks/useBrowserState";

interface SidebarProps {
  spaces: Space[];
  activeSpaceId: string;
  pinnedTabs: Tab[];
  unpinnedTabs: Tab[];
  activeTabId: string;
  collapsed: boolean;
  onSpaceSwitch: (id: string) => void;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabPin: (id: string) => void;
  onTabSplit: (id: string) => void;
  onAddTab: () => void;
  onToggleCollapse: () => void;
  onAccountClick: () => void;
  onNavigate: (url: string) => void;
  user?: {
    username?: string;
    email?: string;
    avatar_url?: string;
    is_admin?: number;
  } | null;
}

const SIDEBAR_FEATURES = [
  { icon: Gamepad2, label: "Games", url: "petezah://games" },
  { icon: AppWindow, label: "Apps", url: "petezah://apps" },
  { icon: Bot, label: "AI", url: "petezah://ai" },
  { icon: Music, label: "Music", url: "petezah://music" },
  { icon: Film, label: "Movies", url: "petezah://movies" },
  { icon: MessageCircle, label: "Chat", url: "petezah://chat" },
];

export default function Sidebar({
  spaces,
  activeSpaceId,
  pinnedTabs,
  unpinnedTabs,
  activeTabId,
  collapsed,
  onSpaceSwitch,
  onTabSelect,
  onTabClose,
  onTabPin,
  onTabSplit,
  onAddTab,
  onToggleCollapse,
  onAccountClick,
  onNavigate,
  user,
}: SidebarProps) {
  const allTabs = [...pinnedTabs, ...unpinnedTabs];
  const displayName = user?.username || user?.email?.split("@")[0] || "Guest";
  const isLoggedIn = !!user;

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
      className="h-full flex flex-col sidebar-gradient border-r border-border overflow-hidden flex-shrink-0"
    >
      <div
        className={`flex items-center flex-shrink-0 ${
          collapsed
            ? "flex-col justify-center gap-1 py-2"
            : "justify-between px-3 pt-3 pb-1"
        }`}
      >
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm font-semibold text-foreground tracking-tight">
              PeteZah
            </span>
          </motion.div>
        )}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onNavigate("petezah://newtab")}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="w-6 h-6 object-contain opacity-70"
            />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-accent text-foreground/60 hover:text-foreground transition-colors mt-1"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="flex-1 flex flex-col items-center overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-none py-1 space-y-1">
            <TabList
              label="Tabs"
              tabs={allTabs}
              activeTabId={activeTabId}
              collapsed
              onSelect={onTabSelect}
              onClose={onTabClose}
              onTogglePin={onTabPin}
              onToggleSplit={onTabSplit}
            />
          </div>

          <div className="flex flex-col items-center gap-0.5 py-2 border-t border-border flex-shrink-0">
            {SIDEBAR_FEATURES.map(({ icon: Icon, label, url }) => (
              <button
                key={label}
                onClick={() => onNavigate(url)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
                title={label}
              >
                <Icon size={12} />
              </button>
            ))}
            <div className="w-4 h-px bg-border my-0.5" />
            <button
              onClick={onAddTab}
              className="w-8 h-8 flex items-center justify-center rounded-lg glass hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
              title="New Tab"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={onAccountClick}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
              title={isLoggedIn ? displayName : "Sign In"}
            >
              {isLoggedIn && user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  className="w-5 h-5 rounded-full object-cover"
                  alt=""
                />
              ) : (
                <User size={13} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto scrollbar-none space-y-0.5 pb-2">
            <TabList
              label="Tabs"
              tabs={allTabs}
              activeTabId={activeTabId}
              onSelect={onTabSelect}
              onClose={onTabClose}
              onTogglePin={onTabPin}
              onToggleSplit={onTabSplit}
            />
          </div>

          <div className="px-2 py-1.5 border-t border-border flex-shrink-0">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {SIDEBAR_FEATURES.map(({ icon: Icon, label, url }) => (
                <button
                  key={label}
                  onClick={() => onNavigate(url)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
                >
                  <Icon size={12} />
                  <span className="text-[9px]">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 mb-1.5">
              <button
                onClick={() => onNavigate("petezah://bookmarks")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
              >
                <Bookmark size={11} />
                <span className="text-[10px]">Saved</span>
              </button>
              <button
                onClick={() => onNavigate("petezah://history")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
              >
                <History size={11} />
                <span className="text-[10px]">History</span>
              </button>
              <button
                onClick={() => onNavigate("petezah://extensions")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground"
              >
                <Puzzle size={11} />
                <span className="text-[10px]">Extensions</span>
              </button>
            </div>

            <button
              onClick={onAddTab}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass hover:bg-accent transition-all text-xs text-foreground/70 hover:text-foreground"
            >
              <Plus size={12} />
              <span className="tracking-wide">New Tab</span>
            </button>

            <div className="flex items-center gap-2 px-2 pt-1.5">
              <button
                onClick={onAccountClick}
                className="flex items-center gap-2 flex-1 py-2 rounded-lg hover:bg-accent transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center border border-border overflow-hidden">
                  {isLoggedIn && user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      className="w-6 h-6 object-cover"
                      alt=""
                    />
                  ) : (
                    <User size={10} className="text-foreground/70" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] text-foreground/80">
                    {displayName}
                  </span>
                  <span className="text-[9px] text-foreground/40">
                    {isLoggedIn ? "Account" : "Sign in"}
                  </span>
                </div>
              </button>
              <button className="p-2 rounded-lg hover:bg-accent transition-all text-foreground/50 hover:text-foreground">
                <Command size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}
