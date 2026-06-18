/**
 * Copy text to the clipboard, resolving to whether it actually succeeded.
 *
 * `navigator.clipboard` only exists in a *secure context* (HTTPS or localhost). On a plain-HTTP
 * origin — common when testing over a LAN IP or an un-TLS'd staging host — it is `undefined`, so a
 * bare `navigator.clipboard?.writeText(...)` silently no-ops while the UI still flips to "copied".
 * The caller then believes the copy worked when nothing was written (the clipboard keeps whatever
 * the user had selected by hand). This falls back to a hidden-textarea + `execCommand("copy")` so
 * the *full* value is reliably copied there too, and returns `false` only when nothing was copied.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied / not focused — fall through to the legacy path.
  }
  return legacyCopy(text);
}

/** Pre-Clipboard-API fallback: select a throwaway off-screen textarea and run the copy command. */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  // Keep it out of view and non-disruptive to scroll/focus.
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  try {
    ta.focus();
    ta.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}
