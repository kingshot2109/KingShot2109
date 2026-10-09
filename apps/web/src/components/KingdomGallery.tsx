import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { TiltCard } from "./AllianceShowcase";
export const galleryImages = [
  ["ouroboros-kingdom", "galleryOro"],
  ["battlefield", "galleryBattle"],
  ["apex-infantry", "galleryInfantry"],
  ["kingdom-monument", "galleryMonument"],
  ["king", "galleryKing"],
  ["hero-recruitment", "galleryHeroes"],
  ["companions", "galleryCompanions"],
  ["academy", "galleryAcademy"],
] as const;
export default function KingdomGallery() {
  const { t, i18n } = useTranslation();
  const track = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const [position, setPosition] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    if (selected !== null) modal.current?.showModal();
  }, [selected]);
  function readPosition() {
    const el = track.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(".game-gallery-card");
    const step = (first?.offsetWidth || 240) + 18;
    const offset = Math.abs(el.scrollLeft);
    setPosition(Math.round(offset / step));
    setEdges({
      start: offset < 5,
      end: offset >= el.scrollWidth - el.clientWidth - 5,
    });
  }
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(readPosition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [i18n.language]);
  function scroll(direction: number) {
    const el = track.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(".game-gallery-card");
    el.scrollBy({
      left:
        direction *
        (i18n.language === "ar" ? -1 : 1) *
        ((first?.offsetWidth || 240) + 18),
      behavior: reduced ? "instant" : "smooth",
    });
  }
  return (
    <section className="kingdom-gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="gallery-heading">
          <div>
            <p className="eyebrow">{t("galleryKicker")}</p>
            <h2 id="gallery-title">{t("galleryTitle")}</h2>
            <p className="gallery-intro">{t("galleryBody")}</p>
          </div>
          <div className="gallery-controls">
            <button
              className="icon-button"
              disabled={edges.start}
              onClick={() => scroll(-1)}
              aria-label={t("previous")}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="icon-button"
              disabled={edges.end}
              onClick={() => scroll(1)}
              aria-label={t("next")}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div
          className="game-gallery-track"
          ref={track}
          onScroll={readPosition}
          tabIndex={0}
          role="region"
          aria-label={t("galleryTitle")}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              scroll(e.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          {galleryImages.map(([file, key], index) => (
            <TiltCard
              key={file}
              className="game-gallery-card"
              onClick={() => setSelected(index)}
              label={`${t("viewImage")}: ${t(key)}`}
            >
              <div className="game-image-frame">
                <img
                  src={`/images/${file}.jpg`}
                  alt={t(key)}
                  loading="lazy"
                  decoding="async"
                />
                <div className="game-image-shade" />
                <span className="image-expand">
                  <Expand size={15} />
                </span>
                <span className="image-number">0{index + 1}</span>
              </div>
              <div className="game-image-caption">
                <span>{t(key)}</span>
                <ArrowRight size={15} />
              </div>
            </TiltCard>
          ))}
        </div>
        <div className="gallery-bottom">
          <span>{t("galleryHint")}</span>
          <span>{String(Math.min(position + 1, 8)).padStart(2, "0")} / 08</span>
        </div>
      </div>
      <dialog
        className="gallery-modal"
        aria-labelledby="gallery-modal-caption"
        ref={modal}
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            modal.current?.close();
            setSelected(null);
          }
        }}
      >
        {selected !== null && (
          <div className="gallery-modal-content">
            <button
              className="icon-button close-dialog"
              onClick={() => {
                modal.current?.close();
                setSelected(null);
              }}
              aria-label={t("close")}
            >
              <X />
            </button>
            <img
              src={`/images/${galleryImages[selected][0]}.jpg`}
              alt={t(galleryImages[selected][1])}
            />
            <p id="gallery-modal-caption">{t(galleryImages[selected][1])}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}
