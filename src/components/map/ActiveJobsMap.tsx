"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapJob = {
  id: string;
  jobNumber: string;
  title: string;
  clientName: string;
  address: string;
  trade: string;
  status: string;
  lat: number;
  lng: number;
};

const TRADE_COLOR: Record<string, string> = {
  HVAC: "#2E4A63",
  ELECTRICAL: "#8A5A19",
  PLUMBING: "#1F5C51",
};

// GTA-ish default center (downtown Toronto) so the map has somewhere to
// sit even before any pins load.
const DEFAULT_CENTER: [number, number] = [43.6532, -79.3832];

export function ActiveJobsMap({ jobs }: { jobs: MapJob[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // React runs effects twice in dev (mount → cleanup → mount). If this
      // run's cleanup already fired before the dynamic import resolved,
      // bail out instead of initializing Leaflet on an already-used container.
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current).setView(DEFAULT_CENTER, 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];

      for (const job of jobs) {
        const color = TRADE_COLOR[job.trade] ?? "#5B6B82";
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([job.lat, job.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<strong>${job.jobNumber} · ${escapeHtml(job.title)}</strong><br/>${escapeHtml(job.clientName)}<br/>${escapeHtml(job.address)}<br/><a href="/jobs/${job.id}" style="color:#D9480F">Open job →</a>`
        );
        marker.on("click", () => {
          // Popup link handles navigation; this just keeps the marker focused.
        });
        bounds.push([job.lat, job.lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-[32rem] w-full rounded-xl border border-[#E3DDD0]" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
