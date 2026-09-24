// Browser notifications for live feeds. They only fire while a PolyScripts
// tab is open - there is no server push - and the preference is per browser.

const KEY = "polyscripts:alerts";

function supported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsEnabled() {
  try {
    return supported() && Notification.permission === "granted" && localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export async function requestNotifications() {
  if (!supported()) return false;
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  const granted = permission === "granted";
  try {
    localStorage.setItem(KEY, granted ? "on" : "off");
  } catch {
    // Preference simply isn't remembered.
  }
  return granted;
}

export function disableNotifications() {
  try {
    localStorage.setItem(KEY, "off");
  } catch {
    // ignore
  }
}

export function notify(title, body) {
  if (!supported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/logo.png", tag: "polyscripts-feed" });
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
