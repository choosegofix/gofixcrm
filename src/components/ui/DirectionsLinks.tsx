"use client";

import { Navigation } from "lucide-react";

function openDirections(e: React.MouseEvent, url: string) {
  e.preventDefault();
  // The URL itself is each provider's official "universal link" format, so
  // the OS opens the native app automatically if it's installed. This just
  // guarantees a visible fallback either way: a real new tab if the popup
  // isn't blocked, or the current tab as a last resort if it is.
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.href = url;
  }
}

export function DirectionsLinks({
  address,
  lat,
  lng,
}: {
  address: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const hasCoords = lat != null && lng != null;
  const dest = hasCoords ? `${lat},${lng}` : encodeURIComponent(address);

  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  const appleMaps = `https://maps.apple.com/?daddr=${dest}`;
  const waze = hasCoords
    ? `https://waze.com/ul?ll=${dest}&navigate=yes`
    : `https://waze.com/ul?q=${dest}&navigate=yes`;

  const linkClass = "font-medium text-[#D9480F] hover:underline";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3]">
      <Navigation size={12} strokeWidth={2} />
      Directions:
      <a href={gmaps} onClick={(e) => openDirections(e, gmaps)} className={linkClass}>
        Google Maps
      </a>
      ·
      <a href={appleMaps} onClick={(e) => openDirections(e, appleMaps)} className={linkClass}>
        Apple Maps
      </a>
      ·
      <a href={waze} onClick={(e) => openDirections(e, waze)} className={linkClass}>
        Waze
      </a>
    </span>
  );
}
