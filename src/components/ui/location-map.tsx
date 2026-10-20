"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { LocationPoint } from "@/lib/address";
import { LockKeyhole } from "lucide-react";
export function LocationMap({
  point,
  onChange,
  compact = false,
  disabled = false,
  unframed = false,
  heightClassName = "h-80",
}: {
  point?: LocationPoint;
  onChange?: (point: LocationPoint) => void;
  compact?: boolean;
  disabled?: boolean;
  unframed?: boolean;
  heightClassName?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const callback = useRef(onChange);
  callback.current = disabled ? undefined : onChange;
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
  useEffect(() => {
    if (!ready || !instance.current) return;
    const map = instance.current;
    for (const handler of [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.boxZoom,
      map.keyboard,
    ]) {
      if (disabled) handler.disable();
      else handler.enable();
    }
    if (!disabled && onChange) marker.current?.dragging?.enable();
    else marker.current?.dragging?.disable();
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [disabled, ready, !!onChange]);
  return (
    <div
      className={`relative isolate overflow-hidden ${unframed ? "rounded-none" : "rounded-2xl border border-zinc-200"}`}
    >
      <div
        className={`transition-[opacity,filter] ${disabled ? "pointer-events-none opacity-60 grayscale" : ""}`}
      >
        <div
          ref={element}
          role="region"
          aria-label="Mapa do endereço do estabelecimento"
          aria-disabled={disabled}
          inert={disabled ? true : undefined}
          className={`relative z-0 w-full bg-zinc-100 ${compact ? "aspect-square" : heightClassName}`}
        />
      </div>
      {disabled && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div
            role="status"
            className="flex max-w-sm items-start gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 text-xs leading-relaxed text-zinc-600 shadow-sm"
          >
            <LockKeyhole
              aria-hidden="true"
              size={18}
              className="mt-0.5 shrink-0 text-[#635BFF]"
            />
            Complete o endereço, incluindo CEP e número, para habilitar o mapa.
          </div>
        </div>
      )}
      {error && (
        <p role="status" className="bg-white px-4 py-2 text-xs text-zinc-500">
          Não foi possível carregar parte do mapa. Tente novamente em instantes.
        </p>
      )}
    </div>
  );
}
