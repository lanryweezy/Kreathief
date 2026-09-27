/**
 * Geolocation Detection Service
 * Determines whether user is in an African region (Paystack preferred) vs Global (Stripe preferred).
 * Uses instant browser heuristics (timezone & locale) with an async IP lookup fallback.
 */

export interface GeoLocationInfo {
  isAfrica: boolean;
  countryCode?: string;
  currency: 'USD' | 'NGN' | 'ZAR' | 'KES' | 'GHS';
  currencySymbol: string;
  recommendedProvider: 'stripe' | 'paystack';
  detectedVia: 'cache' | 'timezone' | 'network' | 'default';
}

const AFRICAN_TIMEZONES = new Set([
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Africa/Tunis',
  'Africa/Addis_Ababa',
  'Africa/Dar_es_Salaam',
  'Africa/Kampala',
  'Africa/Kigali',
  'Africa/Harare',
  'Africa/Lusaka',
  'Africa/Maputo',
  'Africa/Windhoek',
  'Africa/Gaborone',
  'Africa/Dakar',
  'Africa/Abidjan',
  'Africa/Luanda',
  'Africa/Kinshasa',
  'Africa/Douala',
]);

const AFRICAN_COUNTRY_CODES = new Set([
  'NG', 'GH', 'KE', 'ZA', 'EG', 'RW', 'UG', 'TZ', 'ET', 'SN',
  'CI', 'CM', 'MA', 'DZ', 'TN', 'AO', 'MZ', 'ZW', 'ZM', 'BW', 'NA'
]);

class GeoService {
  private cachedInfo: GeoLocationInfo | null = null;
  private readonly CACHE_KEY = 'kreathief_geo_cache';

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(this.CACHE_KEY);
      if (stored) {
        this.cachedInfo = JSON.parse(stored);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }

  /**
   * Synchronously detects location using client-side timezone and browser locale.
   * Zero latency, 100% offline-ready.
   */
  detectSync(): GeoLocationInfo {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    let isAfrica = false;
    let currency: GeoLocationInfo['currency'] = 'USD';
    let currencySymbol = '$';

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && (tz.startsWith('Africa/') || AFRICAN_TIMEZONES.has(tz))) {
        isAfrica = true;
        if (tz === 'Africa/Lagos') {
          currency = 'NGN';
          currencySymbol = '₦';
        } else if (tz === 'Africa/Johannesburg') {
          currency = 'ZAR';
          currencySymbol = 'R';
        } else if (tz === 'Africa/Nairobi') {
          currency = 'KES';
          currencySymbol = 'KSh';
        } else if (tz === 'Africa/Accra') {
          currency = 'GHS';
          currencySymbol = 'GH₵';
        } else {
          currency = 'NGN';
          currencySymbol = '₦';
        }
      }
    } catch {
      // Timezone detection unavailable
    }

    const info: GeoLocationInfo = {
      isAfrica,
      currency,
      currencySymbol,
      recommendedProvider: isAfrica ? 'paystack' : 'stripe',
      detectedVia: 'timezone',
    };

    return info;
  }

  /**
   * Asynchronously refines country info using an IP lookup (non-blocking).
   */
  async detectAsync(): Promise<GeoLocationInfo> {
    const syncResult = this.detectSync();
    if (this.cachedInfo && this.cachedInfo.detectedVia === 'network') {
      return this.cachedInfo;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.country.is', { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const countryCode = data.country?.toUpperCase();
        const isAfrica = AFRICAN_COUNTRY_CODES.has(countryCode);

        let currency: GeoLocationInfo['currency'] = 'USD';
        let currencySymbol = '$';

        if (countryCode === 'NG') {
          currency = 'NGN';
          currencySymbol = '₦';
        } else if (countryCode === 'ZA') {
          currency = 'ZAR';
          currencySymbol = 'R';
        } else if (countryCode === 'KE') {
          currency = 'KES';
          currencySymbol = 'KSh';
        } else if (countryCode === 'GH') {
          currency = 'GHS';
          currencySymbol = 'GH₵';
        }

        const networkResult: GeoLocationInfo = {
          isAfrica,
          countryCode,
          currency,
          currencySymbol,
          recommendedProvider: isAfrica ? 'paystack' : 'stripe',
          detectedVia: 'network',
        };

        this.cachedInfo = networkResult;
        try {
          sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(networkResult));
        } catch {
          // Ignore storage quota
        }

        return networkResult;
      }
    } catch {
      // Fallback to syncResult on network failure
    }

    return syncResult;
  }
}

export const geoService = new GeoService();
