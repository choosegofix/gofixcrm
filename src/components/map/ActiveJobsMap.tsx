"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { tradeAccent } from "@/lib/labels";

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

      // Two jobs at the same address get one pin, not two stacked on top
      // of each other -- split into equal wedges, one per distinct trade
      // present there (half/half for two trades, thirds for three).
      const groups = new Map<string, MapJob[]>();
      for (const job of jobs) {
        const key = `${job.lat},${job.lng}`;
        const existing = groups.get(key);
        if (existing) existing.push(job);
        else groups.set(key, [job]);
      }

      const bounds: [number, number][] = [];

      for (const groupJobs of groups.values()) {
        const { lat, lng, clientName, address } = groupJobs[0];
        const trades = [...new Set(groupJobs.map((j) => j.trade))];
        const colors = trades.map((t) => (tradeAccent as Record<string, string>)[t] ?? "#5B6B82");

        const background =
          colors.length === 1
            ? colors[0]
            : `conic-gradient(${colors
                .map(
                  (c, i) =>
                    `${c} ${(i * 360) / colors.length}deg ${((i + 1) * 360) / colors.length}deg`
                )
                .join(", ")})`;

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${background};width:22px;height:22px;border-radius:9999px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const appleMaps = `https://maps.apple.com/?daddr=${lat},${lng}`;
        const waze = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        const linkStyle =
          "display:inline-block;margin-top:4px;margin-right:8px;font-size:12px;color:#D9480F;text-decoration:none;";

        const openDirections = (url: string) =>
          `window.open('${url}','_blank','noopener,noreferrer')||(window.location.href='${url}');return false;`;

        const jobsHtml = groupJobs
          .map((job) => {
            const dotColor = (tradeAccent as Record<string, string>)[job.trade] ?? "#5B6B82";
            return (
              `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">` +
              `<span style="display:inline-block;width:8px;height:8px;flex-shrink:0;border-radius:9999px;background:${dotColor}"></span>` +
              `<a href="/jobs/${job.id}" style="color:#16233A;font-weight:600;font-size:13px;text-decoration:none">${job.jobNumber} · ${escapeHtml(job.title)}</a>` +
              `</div>`
            );
          })
          .join("");

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="min-width:190px">` +
            `<strong>${escapeHtml(clientName)}</strong><br/>` +
            `${escapeHtml(address)}` +
            `<div style="margin-top:4px">${jobsHtml}</div>` +
            `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #E3DDD0">` +
            `<span style="font-size:11px;color:#8A93A3">Directions:</span><br/>` +
            `<a href="${gmaps}" onclick="${openDirections(gmaps)}" style="${linkStyle}">Google Maps</a>` +
            `<a href="${appleMaps}" onclick="${openDirections(appleMaps)}" style="${linkStyle}">Apple Maps</a>` +
            `<a href="${waze}" onclick="${openDirections(waze)}" style="${linkStyle}">Waze</a>` +
            `</div>` +
            `</div>`
        );
        bounds.push([lat, lng]);
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
