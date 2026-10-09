import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Clock3,
  Crown,
  Flame,
  Infinity,
  Swords,
  Waves,
} from "lucide-react";
import { config } from "../config";

export function TiltCard({
  children,
  className,
  onClick,
  label,
}: {
  children: ReactNode;
  className: string;
  onClick?: () => void;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  function move(event: MouseEvent<HTMLElement>) {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({
      rotateX: ((event.clientY - box.top) / box.height - 0.5) * -7,
      rotateY: ((event.clientX - box.left) / box.width - 0.5) * 9,
    });
  }
  const props = {
    className,
    onMouseMove: move,
    onMouseLeave: () => setTilt({ rotateX: 0, rotateY: 0 }),
    animate: tilt,
    transition: { type: "spring" as const, stiffness: 170, damping: 22 },
    whileHover: reduced ? undefined : { y: -7 },
    style: { transformStyle: "preserve-3d" as const },
  };
  return onClick ? (
    <motion.button
      {...props}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </motion.button>
  ) : (
    <motion.article {...props}>{children}</motion.article>
  );
}
export default function AllianceShowcase() {
  const { t } = useTranslation();
  return (
    <>
      <div className="alliance-strip-meta">
        <span>
          {t("topAlliances")} <b>05</b>
        </span>
        <span>
          <Clock3 size={13} />
          {t("timesUtc")}
        </span>
      </div>
      <div className="alliance-grid alliance-strip">
        {config.alliances.map((alliance, index) => {
          const Icon = (
            {
              infinity: Infinity,
              flame: Flame,
              swords: Swords,
              hydra: Waves,
              crown: Crown,
            } as const
          )[
            alliance.icon as "infinity" | "flame" | "swords" | "hydra" | "crown"
          ];
          return (
            <TiltCard
              key={alliance.tag}
              className={`alliance-card real-alliance accent-${alliance.accent}`}
            >
              <div className="alliance-top">
                <span className="alliance-tag">[{alliance.tag}]</span>
                <span className="alliance-rank">0{index + 1}</span>
              </div>
              <div className="alliance-emblem">
                <Icon size={39} strokeWidth={1.3} />
              </div>
              <h3>{alliance.name}</h3>
              <p className="alliance-story" lang="en">
                {alliance.description}
              </p>
              <div className="alliance-events">
                {alliance.events.length ? (
                  alliance.events.map((event) => (
                    <div className="event-row" key={event.label}>
                      <span>
                        {t(event.label, { defaultValue: event.label })}
                      </span>
                      <strong>
                        {event.times.join(" · ")} <small>{event.zone}</small>
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="event-contact">
                    <Clock3 size={14} />
                    {t("scheduleOnRequest")}
                  </p>
                )}
              </div>
              <a className="alliance-link" href="#apply">
                {t("joinRanks")}
                <ArrowUpRight size={16} />
              </a>
            </TiltCard>
          );
        })}
      </div>
    </>
  );
}
