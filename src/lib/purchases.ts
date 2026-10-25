import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

/**
 * Clover+ — a single one-time purchase that unlocks every paid feature, sold through RevenueCat.
 *
 * RevenueCat decides who has Clover+: anyone with the active `clover_plus` entitlement. The
 * product is the package in the current RevenueCat offering. Until that offering is set up
 * (RevenueCat may not let a product be attached before Apple approves it), Clover loads the App
 * Store product directly and treats owning it as Clover+, so sandbox purchases can be tested
 * end to end. Without an API key (web,
 * or a build made without `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`), development builds fall back
 * to a simulated store so the paywall can still be exercised.
 */

export const PLUS_ENTITLEMENT = 'clover_plus';
/** The non-consumable product ID in App Store Connect. Must match it exactly. */
export const PLUS_PRODUCT_ID = 'clover_plus_lifetime';
/** Shown until the App Store price has loaded (and on platforms without a store). */
export const PLUS_PRICE = '£3.99';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
// Expo Go has no App Store connection for Clover, so it uses the simulated store like web does.
const STORE_AVAILABLE = Platform.OS === 'ios' && !!IOS_API_KEY && !isRunningInExpoGo();

export type PurchaseResult =
  | { status: 'purchased' | 'cancelled' | 'pending' | 'unavailable' }
  | { status: 'error'; message: string };
export type RestoreResult = { status: 'restored' | 'none' } | { status: 'error'; message: string };

/** True while purchases are simulated (no real store connected). */
export const PURCHASES_SIMULATED = __DEV__ && !STORE_AVAILABLE;

let configured = false;

/** Sets up RevenueCat. Safe to call more than once; only the first call does anything. */
export function initPurchases() {
  if (configured || !STORE_AVAILABLE) return;
  configured = true;
  if (__DEV__) {
    void Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    // RevenueCat reports an empty offering as an error, which covers the screen in development.
    // Clover handles that case itself (it asks the App Store directly), so show it as a warning.
    Purchases.setLogHandler((level, message) => {
      if (level === Purchases.LOG_LEVEL.ERROR || level === Purchases.LOG_LEVEL.WARN) console.warn(`[RevenueCat] ${message}`);
    });
  }
  Purchases.configure({ apiKey: IOS_API_KEY! });
}

/** Clover+ is the active entitlement, or (before the entitlement is set up) owning the product itself. */
export const hasPlusEntitlement = (info: CustomerInfo) =>
  info.entitlements.active[PLUS_ENTITLEMENT] !== undefined ||
  info.allPurchasedProductIdentifiers.includes(PLUS_PRODUCT_ID) ||
  info.nonSubscriptionTransactions.some((t) => t.productIdentifier === PLUS_PRODUCT_ID);

/** Current Clover+ status from RevenueCat, or null when the store can't be reached. */
export async function fetchPlusStatus(): Promise<boolean | null> {
  if (!configured) return null;
  try {
    return hasPlusEntitlement(await Purchases.getCustomerInfo());
  } catch (error) {
    console.warn('Clover: could not check Clover+ status', error);
    return null;
  }
}

/** Calls back whenever RevenueCat reports a change (purchase, restore, refund, another device). */
export function onPlusStatusChange(listener: (hasPlus: boolean) => void) {
  if (!configured) return () => {};
  const handler = (info: CustomerInfo) => listener(hasPlusEntitlement(info));
  Purchases.addCustomerInfoUpdateListener(handler);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(handler);
  };
}

type PlusProduct = { pkg?: PurchasesPackage; product: PurchasesStoreProduct };

/** Clover+ from the current RevenueCat offering, or straight from the App Store if the offering is empty. */
async function plusProduct(): Promise<PlusProduct | null> {
  try {
    const current = (await Purchases.getOfferings()).current;
    const pkg = current?.lifetime ?? current?.availablePackages[0];
    if (pkg) return { pkg, product: pkg.product };
  } catch {
    // An offering with no products is reported as an error; fall through to the direct lookup.
  }
  const [product] = await Purchases.getProducts([PLUS_PRODUCT_ID], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  return product ? { product } : null;
}

const isPurchasesError = (error: unknown): error is PurchasesError =>
  typeof error === 'object' && error !== null && 'code' in error;

/** A purchase or restore error, phrased for a person. */
function describeError(error: unknown): string {
  if (!isPurchasesError(error)) return 'Something went wrong. Please try again.';
  // Development builds show RevenueCat's real reason (e.g. a setup problem in the dashboard),
  // which its generic messages hide. Release builds keep the friendly wording.
  if (__DEV__) {
    const detail = error.underlyingErrorMessage || error.userInfo?.readableErrorCode;
    return `${error.message}${detail ? `\n\n${detail}` : ''}\n\n(code ${error.code})`;
  }
  switch (error.code) {
    case Purchases.PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
    case Purchases.PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return 'Clover+ isn’t available to buy right now. Please try again later.';
    case Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'Couldn’t reach the App Store. Check your connection and try again.';
    case Purchases.PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'Purchases aren’t allowed on this device. Check Screen Time restrictions in Settings.';
    case Purchases.PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'The App Store had a problem. Please try again in a moment.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

const SIM_RECEIPT_KEY = 'clover:simulatedReceipt:v1';
const SIM_PRODUCT = 'clover_plus_lifetime';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function buyPlus(): Promise<PurchaseResult> {
  if (PURCHASES_SIMULATED) {
    await wait(700);
    await AsyncStorage.setItem(SIM_RECEIPT_KEY, SIM_PRODUCT);
    return { status: 'purchased' };
  }
  if (!configured) return { status: 'unavailable' };

  try {
    const plus = await plusProduct();
    if (!plus) {
      return {
        status: 'error',
        message: __DEV__
          ? `The App Store didn’t return the product “${PLUS_PRODUCT_ID}”.

Check in App Store Connect that the product ID matches exactly, it’s a Non-Consumable in Ready to Submit, and the Paid Apps agreement is active. New products can take up to an hour to appear.`
          : 'Clover+ isn’t available to buy right now. Please try again later.',
      };
    }
    const { customerInfo } = plus.pkg
      ? await Purchases.purchasePackage(plus.pkg)
      : await Purchases.purchaseStoreProduct(plus.product);
    if (hasPlusEntitlement(customerInfo)) return { status: 'purchased' };
    return { status: 'error', message: 'Your payment went through but Clover+ didn’t unlock. Try Restore purchase.' };
  } catch (error) {
    if (isPurchasesError(error)) {
      const { PURCHASE_CANCELLED_ERROR, PAYMENT_PENDING_ERROR, PRODUCT_ALREADY_PURCHASED_ERROR } = Purchases.PURCHASES_ERROR_CODE;
      if (error.code === PURCHASE_CANCELLED_ERROR || error.userCancelled) return { status: 'cancelled' };
      if (error.code === PAYMENT_PENDING_ERROR) return { status: 'pending' };
      // Already owned on this Apple ID: unlock it rather than failing.
      if (error.code === PRODUCT_ALREADY_PURCHASED_ERROR) {
        const restored = await restorePlus();
        if (restored.status === 'restored') return { status: 'purchased' };
      }
    }
    console.warn('Clover: purchase failed', error);
    return { status: 'error', message: describeError(error) };
  }
}

/** Looks for a previous Clover+ purchase on this Apple ID. */
export async function restorePlus(): Promise<RestoreResult> {
  if (PURCHASES_SIMULATED) {
    await wait(700);
    return { status: (await AsyncStorage.getItem(SIM_RECEIPT_KEY)) === SIM_PRODUCT ? 'restored' : 'none' };
  }
  if (!configured) return { status: 'none' };

  try {
    return { status: hasPlusEntitlement(await Purchases.restorePurchases()) ? 'restored' : 'none' };
  } catch (error) {
    console.warn('Clover: restore failed', error);
    return { status: 'error', message: describeError(error) };
  }
}

/** The Clover+ price as the App Store shows it (local currency), falling back to PLUS_PRICE. */
export function usePlusPrice() {
  const [price, setPrice] = useState(PLUS_PRICE);
  useEffect(() => {
    if (!configured) return;
    let active = true;
    plusProduct()
      .then((plus) => plus && active && setPrice(plus.product.priceString))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return price;
}

/** Development only: forget the simulated purchase entirely. */
export async function clearSimulatedPurchase() {
  await AsyncStorage.removeItem(SIM_RECEIPT_KEY);
}
