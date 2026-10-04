import { useEffect } from 'react';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const GoogleAnalytics = () => {
  useEffect(() => {
    if (!measurementId || document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.gaId = measurementId;
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.dataset.gaId = measurementId;
    inlineScript.text = `window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', { anonymize_ip: true });`;
    document.head.appendChild(inlineScript);

    return () => {
      script.remove();
      inlineScript.remove();
    };
  }, []);

  return null;
};
