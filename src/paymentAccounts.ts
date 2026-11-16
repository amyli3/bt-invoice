import { useMemo, useSyncExternalStore } from 'react';

/* The QuickBooks accounts the Payment Account picker can offer, which of them the
   accounting admin has hidden, and the nickname the admin gave each one. People
   never see a QuickBooks name or card number: an account without a nickname shows
   under a generic name such as "Credit card 1". These account names are made up.

   Shared between Accounting setup (where the admin ticks accounts) and the bill
   and receipt form (where everyone else picks), so it lives outside both. It is
   saved in the browser because the two screens are separate pages in the
   prototype. */

export type PaymentAccount = { name: string; type: 'Credit card' | 'Bank' | 'Other asset' };

export const QBO_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  { name: 'Capital One Spark Business (4821)', type: 'Credit card' },
  { name: 'Chase Ink Business Cash (9937)', type: 'Credit card' },
  { name: 'American Express Gold (1008)', type: 'Credit card' },
  { name: 'Operating Checking (1234)', type: 'Bank' },
  { name: 'Payroll Checking (5521)', type: 'Bank' },
  { name: 'Reserve Savings (8890)', type: 'Bank' },
  { name: 'Undeposited Funds', type: 'Other asset' },
];

const KEY = 'bt-invoice:hidden-payment-accounts';
const ALIAS_KEY = 'bt-invoice:payment-account-aliases';
const ACCESS_KEY = 'bt-invoice:payment-account-access';
const VIEWER_KEY = 'bt-invoice:payment-account-viewer';

/* The internal users the access list can name. Owners can always use every
   account, so they are never listed per account and can't be taken off one. */
export type Person = { name: string; title: string; owner?: boolean };
export const PEOPLE: Person[] = [
  { name: 'Amy Li', title: 'Owner', owner: true },
  { name: 'John Doe', title: 'Project Manager' },
  { name: 'Jane Smith', title: 'Project Manager' },
  { name: 'Sam Taylor', title: 'Bookkeeper' },
];

/* How a person reads wherever they are listed: their name and their title. */
export const personLabel = (p: Person) => `${p.name} (${p.title})`;

/* QuickBooks account name -> the people (besides owners) who can use it. An
   account with no entry here can be used by everyone, which is how it works today. */
export type AccessMap = Record<string, string[]>;

function loadAccess(): AccessMap {
  try {
    const raw = window.localStorage.getItem(ACCESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: AccessMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

function loadViewer(): string {
  try {
    const v = window.localStorage.getItem(VIEWER_KEY);
    return v && PEOPLE.some(p => p.name === v) ? v : PEOPLE[0].name;
  } catch {
    return PEOPLE[0].name;
  }
}

function load(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/* QuickBooks account name -> the alias people see instead of it. An account with
   no alias is shown under its QuickBooks name. */
export type AliasMap = Record<string, string>;

/* Dummy nicknames so the prototype opens with something to look at. They apply
   only until someone saves: once the admin presses Save, whatever they saved
   (even nothing) replaces these. Undeposited Funds is left without one on
   purpose, to show an account that falls back to its generic name. */
const SAMPLE_NICKNAMES: AliasMap = {
  'Capital One Spark Business (4821)': 'Office card',
  'Chase Ink Business Cash (9937)': 'Fuel card',
  'American Express Gold (1008)': 'Materials card',
  'Operating Checking (1234)': 'Main account',
  'Payroll Checking (5521)': 'Payroll',
  'Reserve Savings (8890)': 'Reserve',
};

function loadAliases(): AliasMap {
  try {
    const raw = window.localStorage.getItem(ALIAS_KEY);
    if (raw === null) return { ...SAMPLE_NICKNAMES };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: AliasMap = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string' && v.trim()) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

let hidden: string[] = load();
let aliases: AliasMap = loadAliases();
let access: AccessMap = loadAccess();
let viewer: string = loadViewer();
const listeners = new Set<() => void>();

export function setHiddenPaymentAccounts(next: string[]) {
  hidden = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

export function setPaymentAccountAliases(next: AliasMap) {
  const clean: AliasMap = {};
  for (const [k, v] of Object.entries(next)) if (v.trim()) clean[k] = v.trim();
  aliases = clean;
  try { window.localStorage.setItem(ALIAS_KEY, JSON.stringify(clean)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

export function setPaymentAccountAccess(next: AccessMap) {
  access = next;
  try { window.localStorage.setItem(ACCESS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

/* Who the prototype is acting as, so one screen can show what each person gets. */
export function setPaymentAccountViewer(name: string) {
  viewer = name;
  try { window.localStorage.setItem(VIEWER_KEY, name); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

export function useHiddenPaymentAccounts(): string[] {
  return useSyncExternalStore(subscribe, () => hidden);
}

export function usePaymentAccountAccess(): AccessMap {
  return useSyncExternalStore(subscribe, () => access);
}

export function usePaymentAccountViewer(): string {
  return useSyncExternalStore(subscribe, () => viewer);
}

/* Owners can use every account. Everyone else can use an account that has no
   access list, or one that names them. */
export function canUseAccount(accountName: string, personName: string, map: AccessMap): boolean {
  const person = PEOPLE.find(p => p.name === personName);
  if (person?.owner) return true;
  const list = map[accountName];
  return !list || list.includes(personName);
}

export function usePaymentAccountAliases(): AliasMap {
  return useSyncExternalStore(subscribe, () => aliases);
}

/* The name an account shows under until the admin gives it a nickname: its type and
   its place in the list, never anything from QuickBooks. The number follows the
   QuickBooks list, so naming one account doesn't renumber the others. */
const GENERIC: Record<PaymentAccount['type'], string> = {
  'Credit card': 'Credit card',
  'Bank': 'Bank account',
  'Other asset': 'Other account',
};
export function genericAccountName(accountName: string): string {
  const account = QBO_PAYMENT_ACCOUNTS.find(a => a.name === accountName);
  if (!account) return 'Payment account';
  const sameType = QBO_PAYMENT_ACCOUNTS.filter(a => a.type === account.type);
  return `${GENERIC[account.type]} ${sameType.indexOf(account) + 1}`;
}

/* What an account reads as to anyone but the admin: its nickname, else its generic
   name. */
export const accountDisplayName = (accountName: string, nicknames: AliasMap) =>
  nicknames[accountName]?.trim() || genericAccountName(accountName);

/* One entry in the receipt picker: the QuickBooks name is what gets saved, the
   label is what people read. */
export type PaymentAccountOption = { name: string; label: string };

/* What the receipt picker offers the person using it: every account that is not
   hidden and that the person may use. One with no nickname shows under its generic
   name, because its QuickBooks name can carry the card's last four digits. */
export function usePaymentAccountOptions(): PaymentAccountOption[] {
  const hiddenNow = useHiddenPaymentAccounts();
  const aliasesNow = usePaymentAccountAliases();
  const accessNow = usePaymentAccountAccess();
  const viewerNow = usePaymentAccountViewer();
  return useMemo(
    () => QBO_PAYMENT_ACCOUNTS
      .filter(a => !hiddenNow.includes(a.name) && canUseAccount(a.name, viewerNow, accessNow))
      .map(a => ({ name: a.name, label: accountDisplayName(a.name, aliasesNow) })),
    [hiddenNow, aliasesNow, accessNow, viewerNow],
  );
}
