/**
 * Removes state that the app no longer uses.
 *
 * The lesson progress store used to write to `react-lab-progress` in
 * `localStorage`. Those lessons have been removed, so the stored payload
 * is dead weight. Deleting it on the first load keeps the browser from
 * holding on to data the app can no longer read.
 */

/** Storage keys that belong to features which no longer exist. */
const OBSOLETE_STORAGE_KEYS = ["react-lab-progress"];

/**
 * Deletes the obsolete keys.
 *
 * Failures are ignored on purpose: private-mode browsers can refuse
 * access to storage, and that must never break the app.
 */
export function clearObsoleteStorage(): void {
  try {
    for (const key of OBSOLETE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — nothing to clean up.
  }
}
