import { useEffect, useState } from "react";

// Set to false if your splash.png already has its own "Loading..." text and spinner drawn in it.
const SHOW_LOADER = true;

// Full-screen loading splash. The image "breathes"; a spinner ring and "Loading" text sit under it.
// It fades out when `visible` turns false.
export default function Splash({ visible }) {
  const [mounted, setMounted] = useState(true);
  
  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 450); // wait for the fade-out
    return () => clearTimeout(t);
  }, [visible]);
  
  if (!mounted) return null;
  
  return (
    <div className={"splash" + (visible ? "" : " hide")} role="status" aria-label="Loading Nova X">
      <div className="splash-stack">
        <img className="splash-img" src="/splash.png" alt="Nova X" />
        {SHOW_LOADER && (
          <div className="splash-loader">
            <span className="splash-ring" aria-hidden="true" />
            <span className="splash-text">Loading…</span>
          </div>
        )}
      </div>
    </div>
  );
}