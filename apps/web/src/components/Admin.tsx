import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Download,
  LogOut,
  Search,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import {
  api,
  ApiError,
  errorKey,
  type ApplicationPage,
  type Status,
} from "../api";
import { config, languages } from "../config";
export default function Admin() {
  const { t, i18n } = useTranslation();
  const [key, setKey] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApplicationPage>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const params = new URLSearchParams({
    search: query,
    status,
    page: String(page),
    pageSize: "25",
  });
  useEffect(() => {
    if (!key) return;
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      api<ApplicationPage>(
        `/admin/applications?${new URLSearchParams({ search: query, status, page: String(page), pageSize: "25" })}`,
        {},
        key,
      )
        .then((value) => {
          if (active) setData(value);
        })
        .catch((e) => {
          if (active) {
            setError(errorKey(e));
            if (e instanceof ApiError && e.status === 401) {
              setKey("");
              setData(undefined);
            }
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key, query, status, page, refresh]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<ApplicationPage>(
        "/admin/applications?pageSize=25",
        {},
        draft,
      );
      setData(result);
      setKey(draft);
      setDraft("");
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setLoading(false);
    }
  }
  async function change(id: number, newStatus: Status, oldStatus: Status) {
    setBusy(id);
    setError("");
    try {
      await api(
        `/admin/applications/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
            expectedStatus: oldStatus,
          }),
        },
        key,
      );
      setRefresh((r) => r + 1);
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(null);
    }
  }
  async function download() {
    setLoading(true);
    setError("");
    try {
      if (!config.apiUrl) throw new ApiError("requestError", 503);

      const response = await fetch(
        `${config.apiUrl}/api/admin/applications/export?${params}`,
        { headers: { Authorization: `Bearer ${key}` } },
      );
      if (!response.ok)
        throw new ApiError(
          response.status === 401
            ? "invalidKey"
            : response.status === 429
              ? "rateLimited"
              : "requestError",
          response.status,
        );
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="admin-shell">
      <a className="back-link" href="/">
        <ArrowLeft size={16} />
        {t("backToKingdom")}
      </a>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{t("warCouncil")}</p>
          <h1>{t("adminTitle")}</h1>
        </div>
        <ShieldCheck size={38} />
      </div>
      {!key ? (
        <form className="login-card" onSubmit={login}>
          <h2>{t("adminLogin")}</h2>
          <p>{t("adminDescription")}</p>
          <label className="field">
            <span>{t("adminKey")}</span>
            <input
              type="password"
              required
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button className="button gold" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={16} /> : null}
            {t("signIn")}
          </button>
        </form>
      ) : (
        <>
          <div className="admin-toolbar">
            <label className="search">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                aria-label={t("search")}
                placeholder={t("search")}
                maxLength={100}
              />
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label={t("status")}
            >
              <option value="">{t("allStatuses")}</option>
              {["Pending", "Approved", "Rejected"].map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
            <button
              className="button outline small"
              disabled={loading}
              onClick={download}
            >
              <Download size={16} />
              {t("exportCsv")}
            </button>
            <button
              className="icon-button"
              onClick={() => {
                setKey("");
                setData(undefined);
                setQuery("");
                setStatus("");
                setPage(1);
              }}
              aria-label={t("signOut")}
            >
              <LogOut size={18} />
            </button>
          </div>
          {loading && <p role="status">{t("loading")}</p>}
          <div className="table-scroll">
            <table>
              <caption>
                {t("applicationsCount", { count: data?.total || 0 })}
              </caption>
              <thead>
                <tr>
                  {[
                    "inGameName",
                    "currentKingdom",
                    "totalPower",
                    "killPoints",
                    "troopTier",
                    "discordHandle",
                    "primaryLanguage",
                    "submittedAt",
                    "status",
                  ].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.inGameName}</strong>
                      <details>
                        <summary>{t("details")}</summary>
                        <p>{row.timeZone}</p>
                        <p className="application-notes">
                          {row.additionalNotes || t("noNotes")}
                        </p>
                        {row.screenshotUrl && (
                          <a
                            href={row.screenshotUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t("viewScreenshot")}
                          </a>
                        )}
                      </details>
                    </td>
                    <td>#{row.currentKingdom}</td>
                    <td>{row.totalPower.toLocaleString(i18n.language)}</td>
                    <td>{row.killPoints.toLocaleString(i18n.language)}</td>
                    <td>{row.troopTier}</td>
                    <td>{row.discordHandle}</td>
                    <td>
                      {languages.find(
                        ([code]) => code === row.primaryLanguage,
                      )?.[1] || row.primaryLanguage}
                    </td>
                    <td>
                      {new Date(row.submittedAt).toLocaleDateString(
                        i18n.language,
                      )}
                    </td>
                    <td>
                      <select
                        className={`status-${row.status.toLowerCase()}`}
                        value={row.status}
                        disabled={busy === row.id}
                        aria-label={`${t("status")}: ${row.inGameName}`}
                        onChange={(e) =>
                          change(row.id, e.target.value as Status, row.status)
                        }
                      >
                        {["Pending", "Approved", "Rejected"].map((s) => (
                          <option key={s} value={s}>
                            {t(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.total === 0 && (
              <p className="empty-state">{t("noApplications")}</p>
            )}
          </div>
          <div className="pagination">
            <button
              className="button outline small"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("previous")}
            </button>
            <span>{t("page", { page })}</span>
            <button
              className="button outline small"
              disabled={!data || page * data.pageSize >= data.total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("next")}
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {t(error)}
        </p>
      )}
    </main>
  );
}
