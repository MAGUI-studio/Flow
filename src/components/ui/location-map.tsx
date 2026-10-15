"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { LocationPoint } from "@/lib/address";
export function LocationMap({
  point,
  onChange,
  compact = false,
}: {
  point?: LocationPoint;
  onChange?: (point: LocationPoint) => void;
  compact?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !element.current) return;
        const map = L.map(element.current, { scrollWheelZoom: false }).setView(
          [-14.2, -51.9],
          4,
        );
        instance.current = map;
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILES_URL ??
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        )
          .on("tileerror", () => setError(true))
          .addTo(map);
        const pin = L.divIcon({
          className: "",
          html: '<div class="grid size-[30px] -rotate-45 place-items-center rounded-[50%_50%_50%_0] border-[3px] border-white bg-[#635BFF] shadow-md"><span class="size-2 rounded-full bg-white"></span></div>',
          iconSize: [30, 38],
          iconAnchor: [15, 38],
        });
        marker.current = L.marker([-14.2, -51.9], {
          icon: pin,
          draggable: !!callback.current,
          autoPan: true,
          title: "Localização do estabelecimento",
        });
        marker.current.on("dragend", () => {
          const p = marker.current!.getLatLng();
          callback.current?.({ latitude: p.lat, longitude: p.lng });
        });
        map.on("click", (event) =>
          callback.current?.({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          }),
        );
        observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(element.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      instance.current?.remove();
      instance.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !instance.current || !marker.current) return;
    if (!point) {
      marker.current.remove();
      return;
    }
    marker.current
      .setLatLng([point.latitude, point.longitude])
      .addTo(instance.current);
    instance.current.setView(
      [point.latitude, point.longitude],
      Math.max(instance.current.getZoom(), 16),
    );
  }, [point?.latitude, point?.longitude, ready]);
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-zinc-200">
      <div
        ref={element}
        role="region"
        aria-label="Mapa do endereço do estabelecimento"
        className={`relative z-0 w-full bg-zinc-100 ${compact ? "aspect-square" : "h-80"}`}
      />
      {error && (
        <p role="status" className="bg-white px-4 py-2 text-xs text-zinc-500">
          Não foi possível carregar parte do mapa. Tente novamente em instantes.
        </p>
      )}
    </div>
  );
}
