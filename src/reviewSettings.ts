import { useEffect, useState } from 'react';

/**
 * reviewSettings — presentation variants a reviewer can flip from the Review
 * pill while looking at a page, rather than from a control on the page itself.
 *
 * These are not builder settings. They are the "show me the other version"
 * switches used to walk stakeholders through a comparison: which contract the
 * invoice bills under, and where change orders sit. Putting them on the page
 * would mean shipping a control that no builder should ever see, and putting
 * them in each component's own state would mean they reset whenever the
 * Review frame remounts the app in a device iframe.
 *
 * Persisted in localStorage and mirrored over the `storage` event so the
 * copy of the app running inside the Tablet/Phone iframe follows the same
 * switches as the pill outside it. Same origin, so both see the same key.
 * A custom event covers same-document updates, which `storage` does not fire
 * for. Reads are wrapped because storage access itself can throw in a private
 * window or with site data blocked.
 */

export type ContractType = 'open-book' | 'fixed-price';
export type CoLayout = 'inline' | 'ownGrid';

export interface ReviewSettings {
  contractType: ContractType;
  coLayout: CoLayout;
}

const DEFAULTS: ReviewSettings = {
  // Open book is the default because the fee row (ADO 291436) only exists
  // there, and that is what this page is currently being reviewed for.
  contractType: 'open-book',
  coLayout: 'inline',
};

const KEY = 'bt-review-settings';
const EVENT = 'bt-review-settings-change';

function read(): ReviewSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) as Partial<ReviewSettings> };
  } catch {
    return DEFAULTS;
  }
}

export function setReviewSetting<K extends keyof ReviewSettings>(key: K, value: ReviewSettings[K]) {
  const next = { ...read(), [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Non-persistent is still usable for this session's listeners.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

/** Subscribes to the settings, in this document and in the device iframe. */
export function useReviewSettings(): ReviewSettings {
  const [settings, setSettings] = useState<ReviewSettings>(read);
  useEffect(() => {
    const onLocal = () => setSettings(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setSettings(read()); };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return settings;
}
