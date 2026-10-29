// Loads ad-network SDKs ON DEMAND from the platform settings the admin saved in Admin > Ads.
// Nothing here is required: if no platform is enabled, no SDK is ever loaded.

const scriptCache = new Map();

function loadScript(src, attrs = {}) {
  const key = src + "|" + JSON.stringify(attrs);
  if (scriptCache.has(key)) return scriptCache.get(key);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = () => resolve();
    s.onerror = () => {
      scriptCache.delete(key);
      s.remove();
      reject(new Error("Could not load the ad network. Try again."));
    };
    document.head.appendChild(s);
  });
  scriptCache.set(key, p);
  return p;
}

const ADSGRAM_SCRIPT = "https://sad.adsgram.ai/js/sad.min.js";

export function ensureAdsgram() {
  if (window.Adsgram) return Promise.resolve();
  return loadScript(ADSGRAM_SCRIPT);
}

// "show_123" or "MySdk.showAd" -> callable bound to its parent object (or null)
function getFn(path) {
  const parts = String(path).split(".");
  const name = parts.pop();
  const parent = parts.reduce((o, k) => (o ? o[k] : undefined), window);
  const fn = parent ? parent[name] : undefined;
  return typeof fn === "function" ? fn.bind(parent) : null;
}

const NOT_DONE = "Watch the full ad to earn the reward";
const NO_AD = "No ad available right now";

// Shows one ad for the given platform row (from the `ad_platforms` action).
// Resolves when the ad was shown/completed, throws an Error with a user-friendly message otherwise.
// The reward itself is always decided and paid by the server (ad_start -> ad_complete).
export async function showAd(platform) {
  const c = platform.config || {};
  try {
    if (platform.provider === "adsgram") {
      await ensureAdsgram();
      if (!window.Adsgram) throw new Error(NO_AD);
      let res;
      try {
        res = await window.Adsgram.init({ blockId: c.block_id }).show();
      } catch (r) {
        throw new Error(r && r.state === "load" ? NO_AD : NOT_DONE);
      }
      if (res && res.done === false) throw new Error(NOT_DONE);
      return;
    }
    
    if (platform.provider === "monetag") {
      const fnName = `show_${c.zone_id}`;
      await loadScript(c.script_url, { "data-zone": c.zone_id, "data-sdk": fnName });
      const fn = getFn(fnName);
      if (!fn) throw new Error(NO_AD);
      await fn();
      return;
    }
    
    if (platform.provider === "custom") {
      let attrs = {};
      if (c.script_attrs) {
        try {
          attrs = JSON.parse(c.script_attrs);
        } catch {
          attrs = {};
        }
      }
      await loadScript(c.script_url, attrs);
      const fn = getFn(c.show_function);
      if (!fn) throw new Error(NO_AD);
      const res = await fn();
      if (res && res.done === false) throw new Error(NOT_DONE);
      return;
    }
    
    throw new Error(NO_AD);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error(NO_AD);
  }
}