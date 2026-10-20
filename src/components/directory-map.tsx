"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import type { BusinessCard } from "@/lib/catalog";
import { parseMapBounds } from "@/lib/directory-state";
import { RatingSummary } from "./ui/rating-stars";
import { AnimatedArrow } from "./ui/animated-arrow";
import { BusinessMonogram } from "./ui/business-monogram";

export function DirectoryMap({
  businesses,
  activeId,
  onActiveChange,
  area,
  onSearchArea,
}: {
  businesses: BusinessCard[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  area: string;
  onSearchArea: (area: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layers = useRef<LayerGroup | null>(null);
  const markerItems = useRef<{ marker: Marker; ids: string[] }[]>([]);
  const active = useRef(activeId);
  active.current = activeId;
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [moved, setMoved] = useState(false);
  const [selected, setSelected] = useState<BusinessCard[]>([]);
  const [avatars, setAvatars] = useState<
    { node: HTMLElement; business: BusinessCard }[]
  >([]);
  const [error, setError] = useState(false);
  const initialArea = useRef(area);
  const callbacks = useRef({ onActiveChange, onSearchArea });
  callbacks.current = { onActiveChange, onSearchArea };
  const located = businesses.filter((b) => !b.online && b.location);
  const locationKey = located
    .map((b) => `${b.id}:${b.location!.latitude}:${b.location!.longitude}`)
    .join("|");
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !element.current) return;
        const map = L.map(element.current, {
          scrollWheelZoom: false,
          minZoom: 3,
        }).setView([-14.2, -51.9], 4);
        mapRef.current = map;
        layers.current = L.layerGroup().addTo(map);
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
        map.on("moveend", () => {
          setMoved(true);
          setRevision((r) => r + 1);
        });
        resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(element.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layers.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    setSelected([]);
    const bounds = parseMapBounds(initialArea.current);
    initialArea.current = "";
    if (bounds)
      mapRef.current.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { animate: false },
      );
    else if (located.length)
      mapRef.current.fitBounds(
        located.map(
          (b) =>
            [b.location!.latitude, b.location!.longitude] as [number, number],
        ),
        { padding: [45, 45], maxZoom: 15, animate: false },
      );
    else mapRef.current.setView([-14.2, -51.9], 4);
    setMoved(false);
  }, [ready, locationKey]);
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const bounds = parseMapBounds(area);
    if (bounds)
      mapRef.current.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { animate: false },
      );
    else if (located.length)
      mapRef.current.fitBounds(
        located.map(
          (b) =>
            [b.location!.latitude, b.location!.longitude] as [number, number],
        ),
        { padding: [45, 45], maxZoom: 15, animate: false },
      );
    setMoved(false);
  }, [ready, area]);
  useEffect(() => {
    if (!ready || !mapRef.current || !layers.current) return;
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !mapRef.current || !layers.current) return;
      const map = mapRef.current;
      layers.current.clearLayers();
      markerItems.current = [];
      const nextAvatars: { node: HTMLElement; business: BusinessCard }[] = [];
      const groups: { x: number; y: number; items: BusinessCard[] }[] = [];
      for (const b of located) {
        const pixel = map.latLngToContainerPoint([
          b.location!.latitude,
          b.location!.longitude,
        ]);
        const near = groups.find(
          (g) => Math.hypot(g.x - pixel.x, g.y - pixel.y) < 52,
        );
        if (near) near.items.push(b);
        else groups.push({ x: pixel.x, y: pixel.y, items: [b] });
      }
      for (const { items } of groups) {
        const cluster = items.length > 1;
        const highlighted = items.some((b) => b.id === active.current);
        const latitude =
          items.reduce((sum, b) => sum + b.location!.latitude, 0) /
          items.length;
        const longitude =
          items.reduce((sum, b) => sum + b.location!.longitude, 0) /
          items.length;
        const node = document.createElement("span");
        node.className = `grid place-items-center border-[3px] border-white shadow-md ${cluster ? "size-10 rounded-full bg-[#635BFF] font-semibold text-white" : "size-12 rounded-2xl pr-2"} ${highlighted ? "ring-4 ring-[#635BFF]/30" : ""}`;
        if (cluster) node.textContent = String(items.length);
        else {
          node.style.backgroundColor = items[0].color;
          nextAvatars.push({ node, business: items[0] });
        }
        const marker = L.marker([latitude, longitude], {
          title: cluster
            ? `${items.length} estabelecimentos nesta região`
            : items[0].name,
          icon: L.divIcon({
            className: "",
            iconSize: cluster ? [40, 40] : [48, 48],
            iconAnchor: cluster ? [20, 20] : [24, 24],
            html: node,
          }),
        }).addTo(layers.current!);
        marker
          .getElement()
          ?.setAttribute(
            "aria-label",
            cluster
              ? `${items.length} estabelecimentos nesta região`
              : items[0].name,
          );
        markerItems.current.push({ marker, ids: items.map((b) => b.id) });
        marker.on("click", () => {
          setSelected(items);
          callbacks.current.onActiveChange(items[0].id);
          if (cluster && map.getZoom() < 18)
            map.fitBounds(
              items.map(
                (b) =>
                  [b.location!.latitude, b.location!.longitude] as [
                    number,
                    number,
                  ],
              ),
              { padding: [60, 60], maxZoom: Math.min(map.getZoom() + 3, 18) },
            );
        });
        marker.on("mouseover", () =>
          callbacks.current.onActiveChange(items[0].id),
        );
        marker.on("mouseout", () => callbacks.current.onActiveChange(null));
      }
      setAvatars(nextAvatars);
    });
    return () => {
      disposed = true;
    };
  }, [ready, revision, locationKey]);
  useEffect(() => {
    for (const { marker, ids } of markerItems.current) {
      const highlighted = !!activeId && ids.includes(activeId);
      const element = marker.getElement()?.firstElementChild;
      element?.classList.toggle("ring-4", highlighted);
      element?.classList.toggle("ring-[#635BFF]/30", highlighted);
      marker.setZIndexOffset(highlighted ? 1000 : 0);
    }
  }, [activeId]);
  return (
    <aside
      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white"
      aria-label="Estabelecimentos no mapa"
    >
      {avatars.map(({ node, business }) =>
        createPortal(
          business.coverUrl ? (
            <img
              src={business.coverUrl}
              alt=""
              className="size-full rounded-[inherit] object-cover"
            />
          ) : business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="ml-2 size-8 object-contain"
            />
          ) : (
            <BusinessMonogram name={business.name} compact />
          ),
          node,
          business.id,
        ),
      )}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <strong className="text-sm">Encontre por perto</strong>
        <span className="text-xs text-zinc-500">{located.length} no mapa</span>
      </div>
      <div className="relative isolate">
        <div
          ref={element}
          role="region"
          aria-label="Mapa de estabelecimentos"
          className="relative z-0 h-[440px] bg-zinc-100 lg:h-[620px]"
        />
        {moved && (
          <button
            type="button"
            onClick={() => {
              const bounds = mapRef.current?.getBounds();
              if (!bounds) return;
              callbacks.current.onSearchArea(
                [
                  bounds.getSouth(),
                  bounds.getWest(),
                  bounds.getNorth(),
                  bounds.getEast(),
                ]
                  .map((n) => n.toFixed(5))
                  .join(","),
              );
              setMoved(false);
            }}
            className="absolute top-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-5 py-3 text-xs font-semibold text-[#635BFF] shadow-md hover:bg-[#F5F4FF]"
          >
            Buscar nesta área
          </button>
        )}
        {selected.length > 0 && (
          <div className="absolute right-4 bottom-7 left-4 z-10 max-h-56 overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">
                {selected.length === 1
                  ? "Conheça este espaço"
                  : `${selected.length} espaços nesta região`}
              </span>
              <button
                type="button"
                aria-label="Fechar detalhes do mapa"
                onClick={() => setSelected([])}
                className="rounded px-2 text-zinc-500"
              >
                ×
              </button>
            </div>
            {selected.map((b) => (
              <Link
                key={b.id}
                href={`/${b.slug}`}
                className="flex items-center justify-between gap-3 border-t border-zinc-100 py-3 first:border-0"
              >
                <div>
                  <strong className="text-sm">{b.name}</strong>
                  <p className="my-1 text-[10px] text-zinc-500">
                    {b.category} · {b.city}
                  </p>
                  <RatingSummary rating={b.rating} count={b.ratingCount} />
                </div>
                <AnimatedArrow size={18} className="text-[#635BFF]" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <p
        role="status"
        className="px-5 py-3 text-[10px] leading-relaxed text-zinc-500"
      >
        {error
          ? "Parte do mapa não carregou. Os resultados continuam disponíveis na lista."
          : !located.length
            ? "Não há espaços presenciais com localização para estes filtros. Os atendimentos online continuam na lista."
            : "Clique nos pins para conhecer os espaços. Mova o mapa para explorar outra região."}
      </p>
    </aside>
  );
}
