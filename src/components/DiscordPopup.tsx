import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";

const STORAGE_KEY = "petezah-discord-popup-last";

export default function DiscordPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    if (!last || now - Number(last) > 3600000) {
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-6"
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative z-10 w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={13} className="text-[hsl(235,86%,65%)]" />
                <h2 className="text-sm font-semibold text-foreground">Join our Discord</h2>
              </div>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            <div className="px-5 py-6 flex flex-col gap-4">
              <p className="text-[11px] text-foreground/70 leading-relaxed font-sans">
                Connect with the PeteZah community. Get updates, share feedback, report issues, and hang out with other users.
              </p>

              <div className="flex flex-col gap-2">
                <a
                  href={"https://discord.com/invite/arcgZTV9zX"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="w-full py-2.5 rounded-xl bg-[hsl(235,86%,65%)] hover:bg-[hsl(235,86%,60%)] text-white font-medium text-sm text-center transition-colors"
                >
                  Open Discord
                </a>
                <button
                  onClick={dismiss}
                  className="w-full py-2 rounded-xl text-[11px] text-foreground/40 hover:text-foreground hover:bg-accent transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}