import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw,
  ShieldAlert, Radio, ChevronDown, ChevronUp, Home,
} from "lucide-react";

import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useCommunity } from "@/hooks/useCommunity";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";

const STEP_TIMEOUT = 6000;
const OVERALL_TIMEOUT = 10000;
const isDev = import.meta.env?.DEV;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

const STEP_DEFS = [
  { key: "auth", label: "Authentication", critical: true },
  { key: "perms", label: "User Permissions", critical: false },
  { key: "settings", label: "Loading Settings", critical: false },
  { key: "database", label: "Connecting Database", critical: false },
  { key: "repeaters", label: "Loading Repeaters", critical: false },
  { key: "maptiles", label: "Loading Map Tiles", critical: true },
  { key: "rflayers", label: "Loading RF Layers", critical: false },
  { key: "gps", label: "Starting GPS", critical: false },
];

async function runStep(step, ctx, log) {
  switch (step.key) {
    case "auth": {
      if (!ctx.user) throw new Error("Not authenticated");
      log("Authentication resolved", { userId: ctx.user.id, email: ctx.user.email });
      return;
    }
    case "perms": {
      try {
        const res = await withTimeout(
          mist.functions.invoke("resolvePermissions", {}),
          4000,
          "permissions"
        );
        log("Permissions resolved", {
          count: res?.data?.permissions?.length || 0,
          isAdmin: !!res?.data?.is_admin,
        });
      } catch (e) {
        log("Permissions resolution skipped (non-blocking): " + (e?.message || e));
      }
      return;
    }
    case "settings": {
      if (!ctx.communityId) {
        log("No active community — settings skipped");
        return;
      }
      const s = await withTimeout(
        mist.entities.CommunitySettings.filter({ community_id: ctx.communityId }),
        5000,
        "settings"
      );
      log("Community settings loaded", { count: s?.length || 0 });
      return;
    }
    case "database": {
      const ping = await withTimeout(
        mist.entities.Community.list(null, 1),
        5000,
        "database"
      );
      log("Database reachable", { sample: ping?.length || 0 });
      return;
    }
    case "repeaters": {
      const reps = await withTimeout(
        mist.entities.Repeater.list("-created_date", 1),
        5000,
        "repeaters"
      );
      log("Repeaters endpoint responded", { exists: (reps?.length || 0) > 0 });
      return;
    }
    case "maptiles": {
      await withTimeout(import("leaflet"), 5000, "leaflet");
      await withTimeout(import("react-leaflet"), 5000, "react-leaflet");
      log("Leaflet + react-leaflet loaded");
      return;
    }
    case "rflayers": {
      await withTimeout(import("@turf/turf"), 5000, "turf");
      log("Turf GIS library loaded");
      return;
    }
    case "gps": {
      if (!navigator.geolocation) {
        log("Geolocation not supported — continuing without GPS");
        return;
      }
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            log("GPS fix acquired", {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
            resolve();
          },
          (err) => {
            log("GPS unavailable/denied — continuing without GPS: " + err.message);
            resolve();
          },
          { timeout: 4000, maximumAge: 60000, enableHighAccuracy: false }
        );
      });
      return;
    }
    default:
      return;
  }
}

export default function RadioScopeStartup({ children }) {
  const { user, loading: authLoading } = useMistUser();
  const { isAdmin, maxRoleLevel } = useAdminAccess();
  const { community, communityId } = useCommunity();
  const { data: envData } = useAppEnvironment();

  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(STEP_DEFS.map((s) => [s.key, "pending"]))
  );
  const [phase, setPhase] = useState("running");
  const [errorDetail, setErrorDetail] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const runIdRef = useRef(0);

  const envLabel = envData?.isTest ? "test" : envData?.environment === "dev" ? "test" : "production";

  const writeAudit = useCallback(
    async (action, payload) => {
      try {
        await mist.entities.PlatformAuditLog.create({
          admin_id: user?.id || "radioscope",
          admin_email: user?.email || "",
          action,
          target_type: "content",
          notes: JSON.stringify(payload).slice(0, 4000),
        });
      } catch (e) {
        console.warn("[RadioScope] audit log write skipped:", e?.message || e);
      }
    },
    [user]
  );

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    const startedAt = Date.now();
    const deadline = startedAt + OVERALL_TIMEOUT;
    const stepLogs = [];
    setLogs([]);
    const next = Object.fromEntries(STEP_DEFS.map((s) => [s.key, "pending"]));
    setStatuses(next);

    const log = (msg, data) => {
      const entry = { t: Date.now() - startedAt, msg, data };
      stepLogs.push(entry);
      setLogs((prev) => [...prev, entry]);
      console.log(`[RadioScope] +${entry.t}ms ${msg}`, data ?? "");
    };

    const ctx = { user, community, communityId, env: envLabel };
    log("Initializing RadioScope", {
      env: envLabel,
      userId: user?.id || null,
      communityId: communityId || null,
    });

    const setStep = (key, status) => {
      setStatuses((prev) => ({ ...prev, [key]: status }));
    };

    let failed = null;
    try {
      for (const step of STEP_DEFS) {
        if (runId !== runIdRef.current) return;
        if (Date.now() > deadline) throw new Error("Overall initialization timeout (10s)");
        setStep(step.key, "running");
        const t0 = performance.now();
        try {
          await withTimeout(runStep(step, ctx, log), STEP_TIMEOUT, step.label);
          const dt = Math.round(performance.now() - t0);
          setStep(step.key, "success");
          log(`✓ ${step.label} (${dt}ms)`);
        } catch (err) {
          const dt = Math.round(performance.now() - t0);
          setStep(step.key, "failed");
          log(`✗ ${step.label} failed (${dt}ms): ${err?.message || err}`);
          if (step.critical) {
            failed = { step: step.label, error: err?.message || String(err) };
            throw err;
          }
        }
      }
      if (runId !== runIdRef.current) return;
      log("✓ Ready");
      setPhase("success");
      writeAudit("radioscope_init_success", {
        env: envLabel,
        userId: user?.id,
        communityId,
        duration: Date.now() - startedAt,
        logs: stepLogs,
      });
    } catch (err) {
      if (runId !== runIdRef.current) return;
      const detail = {
        step: failed?.step || "Initialization",
        message: err?.message || String(err),
        stack: isDev ? err?.stack : null,
        logs: stepLogs,
        duration: Date.now() - startedAt,
      };
      setErrorDetail(detail);
      setPhase("error");
      log(`✗ Initialization aborted: ${detail.message}`);
      writeAudit("radioscope_init_failed", {
        env: envLabel,
        userId: user?.id,
        communityId,
        error: detail.message,
        step: detail.step,
        logs: stepLogs,
        duration: detail.duration,
      });
    }
  }, [user, community, communityId, envLabel, writeAudit]);

  useEffect(() => {
    if (authLoading) return;
    setPhase("running");
    setErrorDetail(null);
    run();
    return () => {
      runIdRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const retry = () => {
    setPhase("running");
    setErrorDetail(null);
    run();
  };

  if (phase === "success") return children;

  return (
    <div className="fixed inset-0 z-[56] bg-black flex flex-col items-center justify-center px-4 overflow-y-auto" style={{ height: "100dvh" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-16 h-16 mb-3">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Radio className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-cyan-300 tracking-wide">
            {phase === "error" ? "Initialization Failed" : "Initializing RadioScope..."}
          </h1>
          <p className="text-[10px] text-cyan-500/60 tracking-widest uppercase mt-1">
            Tactical RF Map · {envLabel}
          </p>
        </div>

        {/* Step list */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur p-4 space-y-2.5">
          {STEP_DEFS.map((step) => {
            const s = statuses[step.key];
            return (
              <div key={step.key} className="flex items-center gap-3 text-sm">
                {s === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : s === "failed" ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : s === "running" ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                )}
                <span className={
                  s === "success" ? "text-white" :
                  s === "failed" ? "text-rose-300" :
                  s === "running" ? "text-cyan-200" : "text-white/40"
                }>
                  {step.label}
                  {s === "failed" && !step.critical && " (disabled)"}
                </span>
                {s === "running" && (
                  <span className="ml-auto text-[10px] text-cyan-500/60 animate-pulse">loading</span>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-3 text-sm pt-1 border-t border-white/10 mt-1">
            {phase === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : phase === "error" ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
            )}
            <span className={phase === "error" ? "text-rose-300 font-semibold" : "text-white/70"}>
              {phase === "success" ? "Ready" : phase === "error" ? "Failed" : "Ready"}
            </span>
          </div>
        </div>

        {/* Error actions */}
        {phase === "error" && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-semibold">{errorDetail?.step}</span> failed.
                {errorDetail?.message && (
                  <span className="block text-rose-300/70 mt-0.5 break-words">{errorDetail.message}</span>
                )}
              </div>
            </div>

            <button
              onClick={retry}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>

            {(isAdmin || maxRoleLevel >= 1) && (
              <div>
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-white/15 text-white/70 text-xs hover:bg-white/5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  View Error Details (Admin Only)
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-white/60 max-h-52 overflow-y-auto space-y-0.5">
                    <div className="text-amber-300/80 mb-1">
                      env={envLabel} user={user?.id || "none"} community={communityId || "none"} duration={errorDetail?.duration}ms
                    </div>
                    {errorDetail?.stack && (
                      <pre className="text-rose-300/60 whitespace-pre-wrap break-all mb-1">{errorDetail.stack}</pre>
                    )}
                    {errorDetail?.logs?.map((l, i) => (
                      <div key={i}>
                        <span className="text-white/40">+{l.t}ms</span> {l.msg}
                        {l.data ? <span className="text-white/30"> {JSON.stringify(l.data)}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/15 text-white/70 text-sm hover:bg-white/5"
            >
              <Home className="w-4 h-4" /> Return to Dashboard
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-white/30">
          {phase === "running"
            ? "If this takes too long, a timeout will trigger in 10s."
            : "RadioScope · MIST Platform"}
        </div>
      </div>
    </div>
  );
}