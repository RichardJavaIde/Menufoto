//src/components/tv/tv-player.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./tv.css";
import { mediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/format";
import {
  buildFrames,
  type TvFrame,
  type TvFrameDish,
  type TvPayload,
} from "@/lib/tv-frames";

const W = 1920;
const H = 1080;
const MIN_REFRESH_MS = 30_000;
const FETCH_TIMEOUT_MS = 8_000;

type Props = {
  token: string;
  initial: TvPayload;
  etag: string;
  serverNowMs: number;
};

type RefreshResult = { data: TvPayload; notice: string | null };

export function TvPlayer({ token, initial, etag, serverNowMs }: Props) {
  const [data, setData] = useState<TvPayload>(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [frames, setFrames] = useState<TvFrame[] | null>(null);
  const [index, setIndex] = useState(0);

  // Diferencia entre el reloj del servidor y el de la TV (muchas TV tienen la hora mal)
  const offset = useRef(serverNowMs - Date.now());
  const etagRef = useRef(etag);
  const lastFetch = useRef(0);

  const now = () => Date.now() + offset.current;

  function build(d: TvPayload) {
    return buildFrames(d.slides, d.dishes, d.categories, d.timezone, now());
  }

  // Pide datos nuevos al servidor. Si algo falla, se sigue con lo que ya hay.
  async function refresh(current: TvPayload, currentNotice: string | null): Promise<RefreshResult> {
    const keep = { data: current, notice: currentNotice };
    if (Date.now() - lastFetch.current < MIN_REFRESH_MS) return keep;
    lastFetch.current = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/tv/${encodeURIComponent(token)}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "If-None-Match": etagRef.current },
      });

      const serverDate = Date.parse(res.headers.get("date") ?? "");
      if (!Number.isNaN(serverDate)) offset.current = serverDate - Date.now();

      if (res.status === 304) return { data: current, notice: null };
       if (res.status === 404) {
        // Solo es "enlace no válido" si lo dice nuestro API; un 404 de otro tipo se ignora
        const missing = await res.json().catch(() => null);
        return missing?.status === "missing"
          ? { data: current, notice: "Enlace no válido" }
          : keep;
      }
      if (!res.ok) return keep;

      const body = await res.json();

      // Servidor reiniciado (actualización): se recarga la página completa
      if (body.bootId !== initial.bootId) {
        window.location.reload();
        return keep;
      }
      if (body.status === "inactive") return { data: current, notice: "Pantalla desactivada" };

      const payload = body as TvPayload;
      // Cambió el tema (colores o tipografías): también se recarga
      if (payload.appearanceKey !== initial.appearanceKey) {
        window.location.reload();
        return keep;
      }

      etagRef.current = res.headers.get("etag") ?? etagRef.current;
      return { data: payload, notice: null };
    } catch {
      return keep;
    } finally {
      clearTimeout(timer);
    }
  }

  // Escala el lienzo 1920×1080 a la pantalla
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Primera construcción de la lista
  useEffect(() => {
    lastFetch.current = Date.now();
    setFrames(build(initial));
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avanza a la siguiente; al terminar la vuelta pide datos nuevos y recalcula
  useEffect(() => {
    if (!frames) return;
    const current = frames[index];
    const seconds = notice || !current ? 10 : current.seconds;
    let cancelled = false;

    const timer = setTimeout(async () => {
      const next = index + 1;
      if (!notice && next < frames.length) {
        setIndex(next);
        return;
      }
      const fresh = await refresh(data, notice);
      if (cancelled) return;
      setData(fresh.data);
      setNotice(fresh.notice);
      setFrames(fresh.notice ? [] : build(fresh.data));
      setIndex(0);
    }, seconds * 1000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, index, data, notice]);

  // Precarga las fotos de la siguiente diapositiva
  useEffect(() => {
    if (!frames || frames.length < 2) return;
    const next = frames[(index + 1) % frames.length];
    next.dishes.forEach((d) => {
      if (d.imageKey) {
        const img = new window.Image();
        img.src = mediaUrl(d.imageKey, 960);
      }
    });
  }, [frames, index]);

  const frame = frames ? frames[index] : undefined;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: W,
          height: H,
          overflow: "hidden",
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null || frames === null ? "hidden" : "visible",
        }}
      >
        {notice ? (
          <NoticeView text={notice} />
        ) : frame ? (
          <FrameView
            key={frame.key}
            frame={frame}
            restaurantName={data.restaurantName}
            logoKey={data.logoKey}
            symbol={data.currencySymbol}
          />
        ) : frames ? (
          <IdleView restaurantName={data.restaurantName} logoKey={data.logoKey} />
        ) : null}
      </div>
    </div>
  );
}

function NoticeView({ text }: { text: string }) {
  return (
    <div className="tv-frame tv-fx-fade flex items-center justify-center">
      <p className="text-[64px]" style={{ color: "var(--m-muted)" }}>
        {text}
      </p>
    </div>
  );
}

function IdleView({
  restaurantName,
  logoKey,
}: {
  restaurantName: string;
  logoKey: string | null;
}) {
  return (
    <div className="tv-frame tv-fx-fade flex flex-col items-center justify-center gap-10">
      {logoKey && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(logoKey, 960)} alt="" className="h-[260px] w-auto object-contain" />
      )}
      <h1 className="text-[110px] leading-none" style={{ color: "var(--m-primary)" }}>
        {restaurantName}
      </h1>
    </div>
  );
}

function FrameView({
  frame,
  restaurantName,
  logoKey,
  symbol,
}: {
  frame: TvFrame;
  restaurantName: string;
  logoKey: string | null;
  symbol: string;
}) {
  const style = { "--tv-seconds": `${frame.seconds}s` } as CSSProperties;

  return (
    <div
      className={`tv-frame tv-fx-${frame.effect.toLowerCase()} flex flex-col`}
      style={{ ...style, padding: "54px 96px" }}
    >
      <div className="flex h-[130px] shrink-0 items-center justify-between">
        <div className="flex items-baseline gap-8">
          <h1 className="text-[84px] leading-none" style={{ color: "var(--m-primary)" }}>
            {frame.title}
          </h1>
          {frame.pages > 1 && (
            <span className="text-[36px]" style={{ color: "var(--m-muted)" }}>
              {frame.page}/{frame.pages}
            </span>
          )}
        </div>
        {logoKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(logoKey, 480)} alt="" className="h-[96px] w-auto object-contain" />
        ) : (
          <span className="text-[40px]" style={{ color: "var(--m-muted)" }}>
            {restaurantName}
          </span>
        )}
      </div>

      {frame.kind === "CATEGORY" ? (
        <CategoryList dishes={frame.dishes} symbol={symbol} />
      ) : (
        <div className="flex flex-1 items-center justify-center gap-[54px]">
          {frame.dishes.map((d) => (
            <DishCard key={d.id} dish={d} symbol={symbol} />
          ))}
        </div>
      )}
    </div>
  );
}

function DishCard({ dish: d, symbol }: { dish: TvFrameDish; symbol: string }) {
  const discount = d.offer !== null ? Math.round((1 - d.offer / d.priceCents) * 100) : 0;

  return (
    <div className="w-[540px]">
      <div
        className="tv-photo relative h-[470px] w-full rounded-[28px]"
        style={{ background: "var(--m-surface)" }}
      >
        {d.imageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(d.imageKey, 960)} alt="" />
        ) : (
          <div
            className="flex h-full items-center justify-center text-[160px] opacity-30"
            style={{ color: "var(--m-muted)" }}
          >
            {d.name.charAt(0)}
          </div>
        )}
        {d.offer !== null && discount > 0 && (
          <span
            className="absolute left-5 top-5 rounded-full px-6 py-2 text-[34px] font-bold"
            style={{ background: "var(--m-primary)", color: "var(--m-on-primary)" }}
          >
            -{discount}%
          </span>
        )}
      </div>

      <h2 className="mt-6 line-clamp-2 text-[46px] leading-[1.1]">{d.name}</h2>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-5">
        {d.offer !== null ? (
          <>
            <span className="text-[60px] font-bold" style={{ color: "var(--m-accent)" }}>
              {formatPrice(d.offer, symbol)}
            </span>
            <span className="text-[34px] line-through" style={{ color: "var(--m-muted)" }}>
              {formatPrice(d.priceCents, symbol)}
            </span>
          </>
        ) : (
          <span className="text-[56px] font-semibold" style={{ color: "var(--m-primary)" }}>
            {formatPrice(d.priceCents, symbol)}
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryList({ dishes, symbol }: { dishes: TvFrameDish[]; symbol: string }) {
  return (
    <div
      className="grid flex-1 gap-x-[72px]"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "repeat(5, minmax(0, 1fr))",
        gridAutoFlow: "column",
      }}
    >
      {dishes.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-7 border-b-2 py-3"
          style={{ borderColor: "var(--m-border)", opacity: d.available ? 1 : 0.45 }}
        >
          {d.imageKey && (
            <div className="tv-photo h-[120px] w-[120px] shrink-0 rounded-[20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(d.imageKey, 480)} alt="" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-[40px] leading-[1.1]">{d.name}</h2>
            {d.description && (
              <p
                className="mt-1 line-clamp-1 text-[26px]"
                style={{ color: "var(--m-muted)" }}
              >
                {d.description}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            {!d.available ? (
              <span className="text-[32px]" style={{ color: "var(--m-muted)" }}>
                Agotado
              </span>
            ) : d.offer !== null ? (
              <>
                <div className="text-[42px] font-bold" style={{ color: "var(--m-accent)" }}>
                  {formatPrice(d.offer, symbol)}
                </div>
                <div className="text-[26px] line-through" style={{ color: "var(--m-muted)" }}>
                  {formatPrice(d.priceCents, symbol)}
                </div>
              </>
            ) : (
              <div className="text-[42px] font-semibold" style={{ color: "var(--m-primary)" }}>
                {formatPrice(d.priceCents, symbol)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}