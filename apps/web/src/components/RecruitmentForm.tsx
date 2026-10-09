import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { api, errorKey } from "../api";
import { config, languages, timeZones } from "../config";
const schema = z.object({
  inGameName: z.string().trim().min(2).max(60),
  currentKingdom: z.coerce.number().int().min(1).max(999999),
  totalPower: z.coerce.number().int().min(1).max(1e15),
  killPoints: z.preprocess(
    (value) => (value === "" ? NaN : value),
    z.coerce.number().int().min(0).max(1e15),
  ),
  troopTier: z.enum(["T4", "T5", "T5 Max"]),
  discordHandle: z.string().trim().min(2).max(80),
  primaryLanguage: z.enum(
    languages.map(([code]) => code) as [string, ...string[]],
  ),
  timeZone: z.enum(timeZones as [string, ...string[]]),
  screenshotUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) =>
        !value ||
        (() => {
          try {
            return ["https:", "http:"].includes(new URL(value).protocol);
          } catch {
            return false;
          }
        })(),
    ),
  additionalNotes: z.string().trim().max(2000),
  website: z.string().max(200),
  consent: z.literal(true),
});
type FormData = z.infer<typeof schema>;
export default function RecruitmentForm() {
  const { t, i18n } = useTranslation();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      troopTier: "T4",
      primaryLanguage: i18n.language,
      timeZone: "UTC+05:30",
      screenshotUrl: "",
      additionalNotes: "",
      website: "",
    },
  });
  useEffect(() => {
    if (success) dialog.current?.showModal();
  }, [success]);
  async function submit(data: FormData) {
    setError("");
    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify(data),
      });
      reset();
      setSuccess(true);
    } catch (e) {
      setError(errorKey(e));
    }
  }
  const field = (name: keyof FormData, type = "text", optional = false) => (
    <label className="field">
      <span>
        {t(name)}
        {!optional && <b> *</b>}
      </span>
      <input
        {...register(name)}
        type={type}
        autoComplete={name === "inGameName" ? "nickname" : "off"}
        min={type === "number" ? (name === "killPoints" ? 0 : 1) : undefined}
        step={type === "number" ? 1 : undefined}
        maxLength={
          name === "inGameName"
            ? 60
            : name === "discordHandle"
              ? 80
              : name === "screenshotUrl"
                ? 2048
                : undefined
        }
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <small id={`${name}-error`} role="alert">
          {t(name === "screenshotUrl" ? "invalidUrl" : "invalidField")}
        </small>
      )}
    </label>
  );
  return (
    <>
      <form
        onSubmit={handleSubmit(submit)}
        className="application-form"
        noValidate
      >
        <div className="form-heading">
          <span className="step-badge">01</span>
          <div>
            <h3>{t("playerProfile")}</h3>
            <p>{t("formIntro")}</p>
          </div>
          <ShieldCheck size={25} />
        </div>
        <div className="form-grid">
          {field("inGameName")}
          {field("currentKingdom", "number")}
          {field("totalPower", "number")}
          {field("killPoints", "number")}
          <label className="field">
            <span>{t("troopTier")} *</span>
            <select {...register("troopTier")}>
              {["T4", "T5", "T5 Max"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {field("discordHandle")}
          <label className="field">
            <span>{t("primaryLanguage")} *</span>
            <select {...register("primaryLanguage")}>
              {languages.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("timeZone")} *</span>
            <select {...register("timeZone")}>
              {timeZones.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <div className="full">{field("screenshotUrl", "url", true)}</div>
          <label className="field full">
            <span>{t("additionalNotes")}</span>
            <textarea
              {...register("additionalNotes")}
              rows={4}
              maxLength={2000}
              placeholder={t("messagePlaceholder")}
            />
            {errors.additionalNotes && (
              <small role="alert">{t("invalidField")}</small>
            )}
          </label>
        </div>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input {...register("website")} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="consent">
          <input {...register("consent")} type="checkbox" />
          <span>{t("consent")}</span>
        </label>
        {errors.consent && (
          <p className="error" role="alert">
            {t("consentRequired")}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        <button className="button gold wide" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <ArrowUpRight size={18} />
          )}{" "}
          {t(isSubmitting ? "submitting" : "submitApplication")}
        </button>
        <p className="form-note">
          <ShieldCheck size={13} />
          {t("privacyNote")}
        </p>
      </form>
      <dialog
        ref={dialog}
        onCancel={() => setSuccess(false)}
        onClose={() => setSuccess(false)}
        className="success-modal"
      >
        <button
          className="icon-button close-dialog"
          onClick={() => {
            dialog.current?.close();
            setSuccess(false);
          }}
          aria-label={t("close")}
        >
          <X />
        </button>
        <span className="success-icon">
          <Check />
        </span>
        <h2>{t("successTitle")}</h2>
        <p>{t("successBody")}</p>
        {config.discord ? (
          <a
            className="button gold"
            href={config.discord}
            target="_blank"
            rel="noreferrer"
          >
            {t("joinDiscord")}
            <ArrowUpRight size={16} />
          </a>
        ) : (
          <p className="muted">{t("discordUnavailable")}</p>
        )}
      </dialog>
    </>
  );
}
