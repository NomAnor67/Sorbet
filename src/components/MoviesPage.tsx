import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Trash2, X, Edit2, FolderOpen, Folder, ChevronDown, ChevronRight, Bookmark, Film, Search, Heart, ArrowLeft } from "lucide-react";

interface CatalogItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

interface SavedMovie {
  id: string;
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  groupId: string | null;
  season?: number;
  episode?: number;
  createdAt: number;
}

interface MovieGroup {
  id: string;
  name: string;
  collapsed: boolean;
  createdAt: number;
}

function FluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : canvas.offsetWidth;
      const h = parent ? parent.clientHeight : canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const blobs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * (canvas.offsetWidth || 800),
      y: Math.random() * (canvas.offsetHeight || 600),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 140 + Math.random() * 200,
      hue: 220 + i * 10,
      saturation: 70 + Math.random() * 20,
      lightness: 45 + Math.random() * 15,
      opacity: 0.15 + Math.random() * 0.12,
    }));

    let time = 0;
    const animate = () => {
      time += 0.003;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      blobs.forEach((b) => {
        b.x += b.vx + Math.sin(time + b.hue) * 0.15;
        b.y += b.vy + Math.cos(time * 0.7 + b.hue) * 0.15;

        const dx = mouseRef.current.x - b.x;
        const dy = mouseRef.current.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          b.x += dx * 0.003;
          b.y += dy * 0.003;
        }

        if (b.x < -b.radius) b.x = w + b.radius;
        if (b.x > w + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = h + b.radius;
        if (b.y > h + b.radius) b.y = -b.radius;

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, `hsla(${b.hue},${b.saturation}%,${b.lightness}%,${b.opacity * 2.2})`);
        grad.addColorStop(0.4, `hsla(${b.hue},${b.saturation}%,${b.lightness}%,${b.opacity * 1.1})`);
        grad.addColorStop(1, `hsla(${b.hue},${b.saturation}%,${b.lightness}%,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      for (let i = 0; i < 3; i++) {
        const wx = w * (0.2 + i * 0.3) + Math.sin(time * 0.5 + i) * 60;
        const wy = h * (0.3 + i * 0.2) + Math.cos(time * 0.4 + i * 2) * 40;
        const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 120);
        wg.addColorStop(0, "hsla(210,70%,90%,0.07)");
        wg.addColorStop(1, "hsla(210,60%,90%,0)");
        ctx.fillStyle = wg;
        ctx.fillRect(0, 0, w, h);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener("mousemove", handleMouse);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

function getSavedMovies(): { items: SavedMovie[]; groups: MovieGroup[] } {
  try {
    const raw = localStorage.getItem("movies-saved");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { items: [], groups: [] };
}

function saveFavorites(data: { items: SavedMovie[]; groups: MovieGroup[] }) {
  try {
    localStorage.setItem("movies-saved", JSON.stringify(data));
  } catch {}
}

const S = {
  bg: "hsl(216 32% 6%)",
  surface: "hsl(216 26% 9%)",
  elevated: "hsl(216 22% 12%)",
  border: "hsl(216 20% 16%)",
  borderFocus: "hsl(213 60% 40%)",
  accent: "hsl(213 70% 58%)",
  accentDim: "hsl(213 50% 40% / 0.3)",
  text: "hsl(0 0% 96%)",
  textSub: "hsl(216 15% 45%)",
  textMuted: "hsl(216 12% 28%)",
  danger: "hsl(0 60% 56%)",
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

interface CatalogCardProps {
  item: CatalogItem;
  type: "movie" | "tv";
  isFavorited: boolean;
  onFavorite: (item: CatalogItem, type: "movie" | "tv") => void;
  onPlay: (item: CatalogItem, type: "movie" | "tv") => void;
}

function CatalogCard({ item, type, isFavorited, onFavorite, onPlay }: CatalogCardProps) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = item.poster_path ? TMDB_IMG + item.poster_path : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: "relative",
        background: S.surface,
        border: `1px solid ${S.border}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = S.borderFocus;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = S.border;
      }}
    >
      {poster && (
  <div style={{ height: 120, overflow: "hidden", cursor: "pointer" }} onClick={() => onPlay(item, type)}>
          <img src={poster} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={title} loading="lazy" />
        </div>
      )}
      <div style={{ padding: "12px" }} onClick={() => onPlay(item, type)}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: S.text, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </h3>
            <p style={{ fontSize: 10, color: S.textMuted, margin: 0 }}>
              {year && <span>{year}</span>}
              {year && type === "tv" && <span> · TV</span>}
              {!year && type === "tv" && <span>TV Show</span>}
            </p>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(item, type);
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(216 32% 6% / 0.85)",
            border: `1px solid ${S.border}`,
            cursor: "pointer",
            color: isFavorited ? S.accent : S.textMuted,
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = S.accent;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = isFavorited ? S.accent : S.textMuted;
          }}
        >
          <Heart size={11} fill={isFavorited ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(item, type);
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(216 32% 6% / 0.85)",
            border: `1px solid ${S.border}`,
            cursor: "pointer",
            color: S.accent,
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.opacity = "0.8";
          }}
        >
          <Play size={10} fill={S.accent} />
        </button>
      </div>
    </motion.div>
  );
}

interface PlayerState {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  season?: number;
  episode?: number;
}

const VIDKING_BASE = "https://www.vidking.net/embed";

function getPlayerUrl(state: PlayerState): string {
  const q = `?color=c4b5fd&autoPlay=true`;
  if (state.type === "movie") {
    return `${VIDKING_BASE}/movie/${state.tmdbId}${q}`;
  }
  const s = Math.max(1, state.season || 1);
  const e = Math.max(1, state.episode || 1);
  return `${VIDKING_BASE}/tv/${state.tmdbId}/${s}/${e}${q}&nextEpisode=true&episodeSelector=true`;
}

export default function MoviesPage() {
  const [data, setData] = useState(getSavedMovies);
  const [catalogData, setCatalogData] = useState<{ movies: CatalogItem[]; tv: CatalogItem[] }>({ movies: [], tv: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "trending">("popular");
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { items, groups } = data;

  const isFavorited = (tmdbId: number, type: "movie" | "tv") => {
    return items.some((i) => i.tmdbId === tmdbId && i.type === type);
  };

  const toggleFavorite = (item: CatalogItem, type: "movie" | "tv") => {
    const tmdbId = item.id;
    const exists = isFavorited(tmdbId, type);

    if (exists) {
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((i) => !(i.tmdbId === tmdbId && i.type === type)),
      }));
    } else {
      const newItem: SavedMovie = {
        id: String(Date.now()),
        type,
        tmdbId,
        title: item.title || item.name || "Untitled",
        poster_path: item.poster_path,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        groupId: null,
        season: type === "tv" ? 1 : undefined,
        episode: type === "tv" ? 1 : undefined,
        createdAt: Date.now(),
      };
      setData((prev) => ({
        ...prev,
        items: [newItem, ...prev.items],
      }));
    }
  };

  useEffect(() => {
    saveFavorites(data);
  }, [data]);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = searchQuery
          ? `/api/tmdb/${activeTab === "movies" ? "movie" : "tv"}/search?q=${encodeURIComponent(searchQuery)}`
          : `/api/tmdb/${activeTab === "movies" ? "movie" : "tv"}/${sortBy}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load catalog");
          return;
        }

        if (activeTab === "movies") {
          setCatalogData((prev) => ({ ...prev, movies: data.results || [] }));
        } else {
          setCatalogData((prev) => ({ ...prev, tv: data.results || [] }));
        }
      } catch (err) {
        setError("Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery) {
      searchTimeoutRef.current = setTimeout(fetchCatalog, 320);
    } else {
      fetchCatalog();
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [activeTab, searchQuery, sortBy]);

  const handlePlayMovie = (item: CatalogItem, type: "movie" | "tv") => {
    const saved = items.find((i) => i.tmdbId === item.id && i.type === type);
    const season = type === "tv" ? (saved?.season || 1) : undefined;
    const episode = type === "tv" ? (saved?.episode || 1) : undefined;

    setPlayerState({
      type,
      tmdbId: item.id,
      title: item.title || item.name || "Untitled",
      season,
      episode,
    });
  };

  const continueList = items.filter((i) => i.type === (activeTab === "movies" ? "movie" : "tv")).slice(0, 10);
  const currentCatalog = activeTab === "movies" ? catalogData.movies : catalogData.tv;

  if (playerState) {
    return (
      <MoviePlayer
        state={playerState}
        onBack={() => setPlayerState(null)}
        onSeasonChange={(season) => {
          setPlayerState((prev) => (prev ? { ...prev, season } : null));
        }}
        onEpisodeChange={(episode) => {
          setPlayerState((prev) => (prev ? { ...prev, episode } : null));
        }}
      />
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: S.bg }}>
      <FluidCanvas />
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 32px 16px", flexShrink: 0, borderBottom: `1px solid ${S.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "hsl(213 50% 40% / 0.25)",
                border: `1px solid hsl(213 60% 40% / 0.35)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Film size={16} style={{ color: S.accent }} />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: S.text, margin: 0 }}>Movies & TV</h1>
              <p style={{ fontSize: 11, color: S.textSub, margin: 0 }}>
                {currentCatalog.length} results · {items.length} saved
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveTab("movies")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 13px",
                background: activeTab === "movies" ? S.accentDim : S.surface,
                border: `1px solid ${activeTab === "movies" ? S.borderFocus : S.border}`,
                borderRadius: 8,
                color: activeTab === "movies" ? S.accent : S.textSub,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                if (activeTab !== "movies") {
                  el.style.borderColor = S.borderFocus;
                  el.style.color = S.text;
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                if (activeTab !== "movies") {
                  el.style.borderColor = S.border;
                  el.style.color = S.textSub;
                }
              }}
            >
              <Film size={12} /> Movies
            </button>
            <button
              onClick={() => setActiveTab("tv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 13px",
                background: activeTab === "tv" ? S.accentDim : S.surface,
                border: `1px solid ${activeTab === "tv" ? S.borderFocus : S.border}`,
                borderRadius: 8,
                color: activeTab === "tv" ? S.accent : S.textSub,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                if (activeTab !== "tv") {
                  el.style.borderColor = S.borderFocus;
                  el.style.color = S.text;
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                if (activeTab !== "tv") {
                  el.style.borderColor = S.border;
                  el.style.color = S.textSub;
                }
              }}
            >
              <Play size={12} /> TV Shows
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 32px", display: "flex", gap: 12, alignItems: "center", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: S.elevated,
              border: `1px solid ${S.border}`,
              borderRadius: 8,
              padding: "8px 11px",
            }}
          >
            <Search size={14} style={{ color: S.textMuted, flexShrink: 0 }} />
            <input
              type="text"
              placeholder={activeTab === "movies" ? "Search movies…" : "Search TV shows…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                color: S.text,
                fontSize: 12,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: S.textMuted,
                  display: "flex",
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {!searchQuery && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "popular" | "trending")}
              style={{
                background: S.elevated,
                border: `1px solid ${S.border}`,
                borderRadius: 8,
                color: S.textSub,
                fontSize: 12,
                padding: "8px 11px",
                outline: "none",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
            </select>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
            scrollbarWidth: "thin",
            scrollbarColor: `${S.border} transparent`,
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "hsl(0 60% 30% / 0.2)",
                border: `1px solid hsl(0 60% 50% / 0.4)`,
                borderRadius: 8,
                color: S.danger,
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {continueList.length > 0 && !searchQuery && (
            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: S.textMuted,
                  margin: "0 0 12px",
                }}
              >
                Continue Watching
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {continueList.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.tmdbId}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: "relative",
                      background: S.surface,
                      border: `1px solid ${S.border}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setPlayerState({
                        type: item.type,
                        tmdbId: item.tmdbId,
                        title: item.title,
                        season: item.type === "tv" ? (item.season || 1) : undefined,
                        episode: item.type === "tv" ? (item.episode || 1) : undefined,
                      });
                    }}
                  >
                    {item.poster_path && (
                      <img
                        src={TMDB_IMG + item.poster_path}
                        style={{ width: "100%", height: 100, objectFit: "cover" }}
                        alt={item.title}
                        loading="lazy"
                      />
                    )}
                    <div style={{ padding: "8px" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: S.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </p>
                      {item.type === "tv" && item.season && (
                        <p style={{ fontSize: 9, color: S.textMuted, margin: "2px 0 0" }}>
                          S{item.season} E{item.episode || 1}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        fontSize: 8,
                        background: S.accent,
                        color: S.bg,
                        padding: "3px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      Resume
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: S.textMuted,
                margin: "0 0 12px",
              }}
            >
              Browse Catalog
            </p>

            {loading && (
              <div style={{ textAlign: "center", color: S.textMuted, padding: "40px 0" }}>
                <p style={{ fontSize: 12 }}>Loading…</p>
              </div>
            )}

            {!loading && currentCatalog.length === 0 && (
              <div style={{ textAlign: "center", color: S.textMuted, padding: "40px 0" }}>
                <p style={{ fontSize: 12 }}>No {activeTab === "movies" ? "movies" : "shows"} found</p>
              </div>
            )}

            {!loading && currentCatalog.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {currentCatalog.map((item) => (
                  <CatalogCard
                    key={`${activeTab}-${item.id}`}
                    item={item}
                    type={activeTab === "movies" ? "movie" : "tv"}
                    isFavorited={isFavorited(item.id, activeTab === "movies" ? "movie" : "tv")}
                    onFavorite={toggleFavorite}
                    onPlay={handlePlayMovie}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MoviePlayerProps {
  state: PlayerState;
  onBack: () => void;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
}

function MoviePlayer({ state, onBack, onSeasonChange, onEpisodeChange }: MoviePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [season, setSeason] = useState(state.season || 1);
  const [episode, setEpisode] = useState(state.episode || 1);

  const playerUrl = getPlayerUrl({
    ...state,
    season: state.type === "tv" ? season : undefined,
    episode: state.type === "tv" ? episode : undefined,
  });

  const tryProxify = (url: string): string => {
    const scramjet = (window as any).scramjet;
    if (scramjet && typeof scramjet.encodeUrl === "function") {
      return scramjet.encodeUrl(url);
    }
    return url;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        background: S.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: `1px solid ${S.border}`, background: S.surface }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "none",
            border: "none",
            color: S.textSub,
            fontSize: 12,
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = S.accent;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = S.textSub;
          }}
        >
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0 }}>{state.title}</h2>
        </div>

        {state.type === "tv" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div>
              <label style={{ fontSize: 10, color: S.textMuted, display: "block", marginBottom: 4 }}>Season</label>
              <input
                type="number"
                min="1"
                value={season}
                onChange={(e) => {
                  const newSeason = Math.max(1, parseInt(e.target.value) || 1);
                  setSeason(newSeason);
                  onSeasonChange(newSeason);
                }}
                style={{
                  width: 50,
                  padding: "6px 8px",
                  background: S.elevated,
                  border: `1px solid ${S.border}`,
                  borderRadius: 6,
                  color: S.text,
                  fontSize: 11,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: S.textMuted, display: "block", marginBottom: 4 }}>Episode</label>
              <input
                type="number"
                min="1"
                value={episode}
                onChange={(e) => {
                  const newEpisode = Math.max(1, parseInt(e.target.value) || 1);
                  setEpisode(newEpisode);
                  onEpisodeChange(newEpisode);
                }}
                style={{
                  width: 50,
                  padding: "6px 8px",
                  background: S.elevated,
                  border: `1px solid ${S.border}`,
                  borderRadius: 6,
                  color: S.text,
                  fontSize: 11,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          src={tryProxify(playerUrl)}
          sandbox="allow-scripts allow-pointer-lock allow-forms allow-same-origin allow-downloads allow-fullscreen"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          title={state.title}
        />
      </div>
    </div>
  );
}