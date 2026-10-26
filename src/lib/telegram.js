export function getTelegram() {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  return tg;
}

// Raw initData string Telegram signs — sent to the backend for verification.
// Also grabs the ?startapp=CODE referral param if the mini app was opened
// via a referral deep link (t.me/yourbot/app?startapp=CODE).
export function getInitData() {
  const tg = getTelegram();
  return tg?.initData ?? "";
}

export function getStartParam() {
  const tg = getTelegram();
  return tg?.initDataUnsafe?.start_param ?? null;
}
