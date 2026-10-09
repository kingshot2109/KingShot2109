import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  ArrowDown,
  Crown,
  Swords,
  Flame,
  Globe2,
  Shield,
  ShieldCheck,
  Users,
  Trophy,
  Crosshair,
  ChevronDown,
  Menu,
  X,
  Compass,
  Clock3,
  HeartHandshake,
  Check,
  MessageCircle,
} from "lucide-react";
import { config, languages } from "./config";
import RecruitmentForm from "./components/RecruitmentForm";
import AllianceShowcase from "./components/AllianceShowcase";
import KingdomGallery from "./components/KingdomGallery";
const KingdomScene = lazy(() => import("./components/KingdomScene"));
const Admin = lazy(() => import("./components/Admin"));
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [number, setNumber] = useState(0);
  const { i18n } = useTranslation();
  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      setNumber(value);
      return;
    }
    let id = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / 1600, 1);
      setNumber(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [visible, value, reduced]);
  return (
    <span ref={ref}>
      {number.toLocaleString(i18n.language, {
        maximumFractionDigits: value % 1 ? 1 : 0,
      })}
      {suffix}
    </span>
  );
}
function DiscordLink({ className = "button outline" }: { className?: string }) {
  const { t } = useTranslation();
  return config.discord ? (
    <a
      className={className}
      href={config.discord}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle size={18} />
      {t("joinDiscord")}
      <ArrowUpRight size={16} />
    </a>
  ) : (
    <button className={className} disabled title={t("discordUnavailable")}>
      <MessageCircle size={18} />
      {t("joinDiscord")}
    </button>
  );
}
function SectionTitle({
  number,
  kicker,
  title,
  body,
}: {
  number: string;
  kicker: string;
  title: string;
  body?: string;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="section-title"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
    >
      <p className="eyebrow">
        <span>{number}</span> {t(kicker)}
      </p>
      <h2>{t(title)}</h2>
      {body && <p>{t(body)}</p>}
    </motion.div>
  );
}
export default function App() {
  const { t, i18n } = useTranslation();
  const [menu, setMenu] = useState(false);
  const reduced = useReducedMotion();
  const admin = location.pathname.replace(/\/$/, "") === "/admin";
  useEffect(() => {
    let active = true;
    const hash = location.hash.slice(1);
    if (!admin && hash)
      document.fonts.ready.then(() => {
        if (active)
          document
            .getElementById(hash)
            ?.scrollIntoView({ behavior: "instant" });
      });
    return () => {
      active = false;
    };
  }, [admin]);
  const nav = [
    ["about", "overview"],
    ["power", "powerNav"],
    ["alliances", "alliancesNav"],
    ["values", "valuesNav"],
    ["faq", "faqNav"],
  ];
  const seoTitle = `KingShot ${config.kingdom} — ${t("heroLine1")} ${t("heroLine2")}`;
  return (
    <>
      <Helmet>
        <title>{admin ? t("adminTitle") : seoTitle}</title>
        <meta name="description" content={t("heroDescription")} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={t("heroDescription")} />
        <meta property="og:type" content="website" />
        {config.siteUrl && (
          <>
            <link
              rel="canonical"
              href={`${config.siteUrl}${admin ? "/admin" : "/"}`}
            />
            <meta property="og:url" content={config.siteUrl} />
            <meta property="og:image" content={`${config.siteUrl}/crest.svg`} />
          </>
        )}
        {admin && <meta name="robots" content="noindex,nofollow" />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `KingShot ${config.kingdom}`,
            about: { "@type": "VideoGame", name: "Kingshot" },
            inLanguage: languages.map(([id]) => id),
            description: t("heroDescription"),
            ...(config.siteUrl ? { url: config.siteUrl } : {}),
          }).replace(/</g, "\\u003c")}
        </script>
      </Helmet>
      {admin ? (
        <Suspense fallback={<p className="loading-page">{t("loading")}</p>}>
          <Admin />
        </Suspense>
      ) : (
        <>
          <a className="skip-link" href="#main">
            {t("skipContent")}
          </a>
          <header className="header">
            <div className="nav-container">
              <a
                className="brand"
                href="#hero"
                aria-label={`KingShot ${config.kingdom}`}
              >
                <img src="/crest.svg" alt="" />
                <span>
                  KINGSHOT <b>{config.kingdom}</b>
                  <small>{t("brandSub")}</small>
                </span>
              </a>
              <nav
                className={menu ? "navigation open" : "navigation"}
                aria-label={t("navigation")}
              >
                {nav.map(([id, key]) => (
                  <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                    {t(key)}
                  </a>
                ))}
                <a href="#community" onClick={() => setMenu(false)}>
                  Discord
                </a>
              </nav>
              <div className="nav-actions">
                <label className="language-picker">
                  <Globe2 size={15} />
                  <span className="sr-only">{t("language")}</span>
                  <select
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    aria-label={t("language")}
                  >
                    {languages.map(([id, label]) => (
                      <option value={id} key={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <a className="button gold nav-cta" href="#apply">
                  {t("applyNow")}
                  <ArrowUpRight size={15} />
                </a>
                <button
                  className="icon-button menu-toggle"
                  onClick={() => setMenu(!menu)}
                  aria-label={t(menu ? "close" : "navigation")}
                  aria-expanded={menu}
                >
                  {menu ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </header>
          <main id="main">
            <section id="hero" className="hero">
              <div className="hero-landscape" aria-hidden="true">
                <div className="mountain mountain-back" />
                <div className="mountain mountain-front" />
                <div className="citadel">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="hero-haze" />
              <div className="hero-layout container">
                <motion.div
                  className="hero-copy"
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="recruitment-pill">
                    <span />
                    {t("recruitmentOpen")}
                    <b>#{config.kingdom}</b>
                  </div>
                  <p className="hero-kicker">{t("heroKicker")}</p>
                  <h1>
                    {t("heroLine1")}
                    <br />
                    <em>{t("heroLine2")}</em>
                  </h1>
                  <p className="hero-description">{t("heroDescription")}</p>
                  <div className="hero-actions">
                    <a className="button gold" href="#apply">
                      {t("submitApplication")}
                      <ArrowUpRight size={18} />
                    </a>
                    <DiscordLink />
                  </div>
                  <div className="hero-reassurance">
                    <div className="warrior-icons">
                      <Shield size={16} />
                      <Swords size={16} />
                      <Crown size={16} />
                    </div>
                    <span>
                      {t("heroReassurance")}
                      <small>{t("globalCoverage")}</small>
                    </span>
                  </div>
                </motion.div>
                <div className="hero-art">
                  <div className="crest-orbit orbit-1" />
                  <div className="crest-orbit orbit-2" />
                  <div className="crest-label crest-label-top">
                    <span>{t("recruitmentOpen")}</span>
                    <Crown size={15} />
                  </div>
                  <img className="crest-fallback" src="/crest.svg" alt="" />
                  {!reduced && (
                    <Suspense fallback={null}>
                      <KingdomScene />
                    </Suspense>
                  )}
                  <div className="crest-plaque">
                    <span>{t("kingdom")}</span>
                    <strong>{config.kingdom}</strong>
                    <small>{t("crestMotto")}</small>
                  </div>
                  <div className="crest-label crest-label-bottom">
                    <ShieldCheck size={14} />
                    <span>{t("unitedByHonor")}</span>
                  </div>
                </div>
              </div>
              <a className="scroll-cue" href="#about">
                <ArrowDown size={15} />
                {t("scrollExplore")}
              </a>
            </section>
            <section id="power" className="power-strip">
              <div className="container">
                <div className="stats-grid">
                  {[
                    [Shield, config.alliances.length, "", "topAlliances"],
                    [
                      Clock3,
                      config.alliances.reduce(
                        (sum, a) =>
                          sum +
                          a.events.reduce((n, e) => n + e.times.length, 0),
                        0,
                      ),
                      "",
                      "scheduleSlots",
                    ],
                    [Globe2, languages.length, "", "languageCount"],
                    [Crown, Number(config.kingdom), "", "kingdom"],
                  ].map(([Icon, value, suffix, key]) => {
                    const I = Icon as typeof Swords;
                    return (
                      <div className="stat" key={String(key)}>
                        <I size={22} />
                        <strong>
                          {key === "kingdom" ? (
                            <span>#{config.kingdom}</span>
                          ) : (
                            <Counter
                              value={Number(value)}
                              suffix={String(suffix)}
                            />
                          )}
                        </strong>
                        <span>{t(String(key))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            <section id="about" className="section container about">
              <div>
                <SectionTitle
                  number="01"
                  kicker="ourKingdom"
                  title="aboutTitle"
                />
                <p className="section-body">{t("aboutBody")}</p>
                <div className="signature">
                  <span />
                  <p>{t("aboutSignature")}</p>
                </div>
              </div>
              <div className="about-mosaic">
                <div className="mosaic-card">
                  <Compass />
                  <strong>{t("strategyTitle")}</strong>
                  <p>{t("strategyBody")}</p>
                </div>
                <div className="mosaic-card">
                  <Clock3 />
                  <strong>{t("coverageTitle")}</strong>
                  <p>{t("coverageBody")}</p>
                </div>
                <div className="mosaic-footer">
                  <ShieldCheck size={21} />
                  <span>{t("aboutCallout")}</span>
                </div>
              </div>
            </section>
            <div className="marquee-band" aria-hidden="true">
              <span>UNITED WE RISE</span>
              <Crown />
              <span>KINGDOM {config.kingdom}</span>
              <Swords />
              <span>FOR HONOR. FOR GLORY.</span>
              <Crown />
              <span>UNITED WE RISE</span>
            </div>
            <section id="alliances" className="section container">
              <div className="section-heading-row">
                <SectionTitle
                  number="02"
                  kicker="ourAlliances"
                  title="alliancesTitle"
                  body="alliancesBody"
                />
                <span className="tiny-badge">
                  <span />
                  {t("recruitmentOpen")}
                </span>
              </div>
              <AllianceShowcase />
            </section>
            <KingdomGallery />
            <section id="values" className="values-wrap">
              <div className="section container">
                <SectionTitle
                  number="03"
                  kicker="ourCode"
                  title="valuesTitle"
                  body="valuesBody"
                />
                <div className="values-grid">
                  {[
                    [Shield, "honor"],
                    [Swords, "coordination"],
                    [HeartHandshake, "unity"],
                    [Crown, "leadership"],
                  ].map(([Icon, key], index) => {
                    const I = Icon as typeof Shield;
                    return (
                      <motion.article
                        key={String(key)}
                        className="value-card"
                        whileHover={
                          reduced
                            ? undefined
                            : { rotateX: 3, rotateY: -3, y: -4 }
                        }
                      >
                        <span className="value-number">0{index + 1}</span>
                        <I size={25} />
                        <h3>{t(`${key}Title`)}</h3>
                        <p>{t(`${key}Body`)}</p>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </section>
            <section id="apply" className="section container apply-layout">
              <div className="apply-copy">
                <SectionTitle
                  number="04"
                  kicker="yourNextChapter"
                  title="applyTitle"
                  body="applyBody"
                />
                <div className="requirements">
                  <h3>{t("requirements")}</h3>
                  {["reqPower", "reqActivity", "reqTeam", "reqDiscord"].map(
                    (key) => (
                      <p key={key}>
                        <Check size={15} />
                        {t(key)}
                      </p>
                    ),
                  )}
                </div>
                <div className="review-note">
                  <Clock3 size={20} />
                  <div>
                    <strong>{t("reviewTitle")}</strong>
                    <p>{t("reviewBody")}</p>
                  </div>
                </div>
              </div>
              <RecruitmentForm />
            </section>
            <section id="faq" className="section container faq-layout">
              <SectionTitle
                number="05"
                kicker="beforeYouMarch"
                title="faqTitle"
                body="faqBody"
              />
              <div className="faq-list">
                {[1, 2, 3, 4].map((n) => (
                  <details key={n}>
                    <summary>
                      <span>{t(`faqQ${n}`)}</span>
                      <ChevronDown size={19} />
                    </summary>
                    <p>{t(`faqA${n}`)}</p>
                  </details>
                ))}
              </div>
            </section>
            <section id="community" className="discord-banner container">
              <div className="discord-symbol">
                <MessageCircle size={65} strokeWidth={1} />
              </div>
              <div>
                <p className="eyebrow">{t("community")}</p>
                <h2>{t("discordTitle")}</h2>
                <p>{t("discordBody")}</p>
                <span className="discord-status">
                  <span />
                  {t("discordStatus")}
                </span>
              </div>
              <div>
                <DiscordLink className="button discord-button" />
                {!config.discord && (
                  <small className="discord-unavailable">
                    {t("discordUnavailable")}
                  </small>
                )}
              </div>
            </section>
          </main>
          <footer className="footer container">
            <div className="footer-top">
              <a className="brand" href="#hero">
                <img src="/crest.svg" alt="" />
                <span>
                  KINGSHOT <b>{config.kingdom}</b>
                  <small>{t("brandSub")}</small>
                </span>
              </a>
              <p>{t("footerMotto")}</p>
              <nav aria-label={t("navigation")}>
                <a href="#about">{t("overview")}</a>
                <a href="#apply">{t("applyNow")}</a>
                <a href="/admin">{t("adminTitle")}</a>
              </nav>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} KingShot {config.kingdom}.{" "}
                {t("rights")}
              </span>
              <p>{t("disclaimer")}</p>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
