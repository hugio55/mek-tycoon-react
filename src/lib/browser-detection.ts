/**
 * Browser detection utilities
 */

/**
 * Detects if the current browser is Safari (desktop or iOS)
 * This includes iPhone, iPad, and Safari on macOS
 * Excludes Chrome, Edge, and other browsers that include "Safari" in user agent
 */
export function isSafariOrIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;

  // Check for iOS devices (iPhone, iPad, iPod)
  const isIOS = /iPhone|iPad|iPod/.test(ua);

  // Check for Safari (but not Chrome, Edge, etc.)
  // Safari will have "Safari" but not "Chrome" or "Chromium"
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);

  return isIOS || isSafari;
}
