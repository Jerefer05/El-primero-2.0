import Script from "next/script";

// Google Analytics 4 y Píxel de Meta. Se activan solo si están cargados en
// Vercel: NEXT_PUBLIC_GA_ID (ej: G-ABC123) y NEXT_PUBLIC_META_PIXEL_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

export default function Analytics() {
  const gaOk = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID);
  const pixelOk = PIXEL_ID && /^\d+$/.test(PIXEL_ID);
  return (
    <>
      {gaOk && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {pixelOk && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
