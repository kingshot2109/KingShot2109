import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { languages } from "./config";
const files = import.meta.glob<Record<string, string>>("./locales/*.json", {
  eager: true,
  import: "default",
});
const resources = Object.fromEntries(
  Object.entries(files).map(([path, value]) => [
    path.split("/").pop()!.replace(".json", ""),
    { translation: value },
  ]),
);
let stored = "en";
try {
  stored =
    localStorage.getItem("kingshot-language") ||
    navigator.language.split("-")[0];
} catch {
  /* storage may be disabled */
}
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languages.some(([id]) => id === stored) ? stored : "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
function applyLanguage(language: string) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem("kingshot-language", language);
  } catch {
    /* optional preference */
  }
}
i18n.on("languageChanged", applyLanguage);
applyLanguage(i18n.language);
export default i18n;
