import { useEffect, useState } from "react";

export default function Splash({ visible }) {
  const [mounted, setMounted] = useState(true);
  
  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 450);
    return () => clearTimeout(t);
  }, [visible]);
  
  if (!mounted) return null;
  
  return (
    <div className={"splash" + (visible ? "" : " hide")} role="status" aria-label="Loading Nova X">
      <img className="splash-img" src="/splash.png" alt="Nova X" />
    </div>
  );
}