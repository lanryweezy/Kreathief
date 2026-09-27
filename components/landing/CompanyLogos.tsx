import React from 'react';

export interface CompanyLogoData {
  name: string;
  country: 'Nigeria' | 'USA' | 'UK';
  countryCode: string;
  flag: string;
  svg: React.ReactNode;
}

export const COMPANY_LOGOS: CompanyLogoData[] = [
  // --- NIGERIA ---
  {
    name: 'Paystack',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect y="3" width="7" height="24" rx="2" fill="currentColor" fillOpacity="0.4" />
        <rect x="11" y="9" width="7" height="18" rx="2" fill="currentColor" />
        <text x="26" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">paystack</text>
      </svg>
    )
  },
  {
    name: 'Flutterwave',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 145 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M4 15C4 9.5 8.5 5 14 5C19.5 5 24 9.5 24 15C24 20.5 19.5 25 14 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M10 15C10 11.7 12.7 9 16 9C19.3 9 22 11.7 22 15C22 18.3 19.3 21 16 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <text x="32" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5px">flutterwave</text>
      </svg>
    )
  },
  {
    name: 'Moniepoint',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 140 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect x="2" y="5" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M7 19V11L12 16L17 11V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="28" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5px">moniepoint</text>
      </svg>
    )
  },
  {
    name: 'Andela',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M12 4L3 24H9L12 17L15 24H21L12 4Z" fill="currentColor" />
        <text x="27" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="1px">ANDELA</text>
      </svg>
    )
  },
  {
    name: 'Piggyvest',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 125 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <circle cx="12" cy="15" r="9" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="12" cy="15" r="4" fill="currentColor" />
        <text x="28" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5px">piggyvest</text>
      </svg>
    )
  },
  {
    name: 'Interswitch',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    svg: (
      <svg viewBox="0 0 135 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <circle cx="9" cy="15" r="6" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="19" cy="15" r="6" stroke="currentColor" strokeWidth="2.5" />
        <text x="32" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="15" letterSpacing="-0.3px">Interswitch</text>
      </svg>
    )
  },

  // --- USA ---
  {
    name: 'Stripe',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 85 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M12.5 10.3C10.6 9.6 9.5 9 9.5 8.1C9.5 7.4 10.1 7 11.2 7C13.2 7 15.2 7.7 16.6 8.4L17.4 3.6C15.7 2.8 13.5 2.1 10.9 2.1C5.6 2.1 2 4.9 2 9.4C2 15.6 10.5 14.6 10.5 17.6C10.5 18.5 9.7 19 8.3 19C6.1 19 3.6 18.1 2 17.1L1.2 22C3.1 23 5.8 23.8 8.4 23.8C13.9 23.8 17.7 21.1 17.7 16.4C17.7 9.8 12.5 10.3 12.5 10.3Z" fill="currentColor" />
        <text x="24" y="20.5" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="18" letterSpacing="-0.8px">stripe</text>
      </svg>
    )
  },
  {
    name: 'Figma',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 95 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <circle cx="8" cy="8" r="4" fill="currentColor" />
        <circle cx="16" cy="8" r="4" fill="currentColor" fillOpacity="0.6" />
        <circle cx="8" cy="16" r="4" fill="currentColor" fillOpacity="0.7" />
        <circle cx="16" cy="16" r="4" fill="currentColor" fillOpacity="0.5" />
        <circle cx="8" cy="24" r="4" fill="currentColor" fillOpacity="0.4" />
        <text x="27" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">Figma</text>
      </svg>
    )
  },
  {
    name: 'Linear',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M3.5 16.5C3.5 9.87 8.87 4.5 15.5 4.5C18.6 4.5 21.4 5.66 23.5 7.6L7.6 23.5C5.66 21.4 4.5 18.6 3.5 16.5Z" fill="currentColor" />
        <circle cx="15.5" cy="15.5" r="11" stroke="currentColor" strokeWidth="2.5" />
        <text x="32" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="17" letterSpacing="-0.5px">Linear</text>
      </svg>
    )
  },
  {
    name: 'OpenAI',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 115 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M15 3L22 7V15L15 19L8 15V7L15 3Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="15" cy="11" r="3.5" fill="currentColor" />
        <text x="30" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">OpenAI</text>
      </svg>
    )
  },
  {
    name: 'Vercel',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 105 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M12 5L22 23H2L12 5Z" fill="currentColor" />
        <text x="30" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">▲ Vercel</text>
      </svg>
    )
  },
  {
    name: 'Nike',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    svg: (
      <svg viewBox="0 0 85 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M3 18C7.5 16.5 13.5 14 18 10C16 14.5 13 19 8 22C4.5 24 2 21 3 18Z" fill="currentColor" />
        <text x="24" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="900" fontStyle="italic" fontSize="18" letterSpacing="1px">NIKE</text>
      </svg>
    )
  },

  // --- UK ---
  {
    name: 'Revolut',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    svg: (
      <svg viewBox="0 0 115 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M5 5H13C16.5 5 19 7.2 19 10.5C19 13.2 17.2 15 14.5 15.6L19.5 24H14.5L10 16.5H8.5V24H5V5ZM8.5 13.2H12.8C14.5 13.2 15.5 12.2 15.5 10.7C15.5 9.2 14.5 8.2 12.8 8.2H8.5V13.2Z" fill="currentColor" />
        <text x="25" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">Revolut</text>
      </svg>
    )
  },
  {
    name: 'Monzo',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    svg: (
      <svg viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <rect x="3" y="7" width="5" height="16" rx="2.5" fill="currentColor" />
        <rect x="10" y="11" width="5" height="12" rx="2.5" fill="currentColor" fillOpacity="0.7" />
        <rect x="17" y="7" width="5" height="16" rx="2.5" fill="currentColor" />
        <text x="28" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">monzo</text>
      </svg>
    )
  },
  {
    name: 'Wise',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    svg: (
      <svg viewBox="0 0 90 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M4 8L8 22L13 14L16 22L21 8H16.5L14.2 16L12 9.5H9L6.8 16L4.5 8H4Z" fill="currentColor" />
        <text x="25" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5px">wise</text>
      </svg>
    )
  },
  {
    name: 'Deliveroo',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    svg: (
      <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <path d="M4 18L10 8L15 14L17 7L22 17C22 21 18 24 13 24C8 24 4 21 4 18Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="11" cy="16" r="1.5" fill="currentColor" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        <text x="27" y="21" fill="currentColor" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5px">deliveroo</text>
      </svg>
    )
  },
  {
    name: 'Nothing',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    svg: (
      <svg viewBox="0 0 115 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
        <circle cx="6" cy="15" r="2" fill="currentColor" />
        <circle cx="12" cy="15" r="2" fill="currentColor" />
        <circle cx="18" cy="15" r="2" fill="currentColor" />
        <text x="26" y="20.5" fill="currentColor" fontFamily="monospace, monospace" fontWeight="700" fontSize="15" letterSpacing="2px">NOTHING</text>
      </svg>
    )
  }
];
