import { Navigation } from "lucide-react";

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
      <a href={gmaps} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Google Maps
      </a>
      ·
      <a href={appleMaps} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Apple Maps
      </a>
      ·
      <a href={waze} target="_blank" rel="noopener noreferrer" className={linkClass}>
        Waze
      </a>
    </span>
  );
}
