"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

type AdminUser = {
  id: string;
  email: string;
  phone: string;
  credits: number;
  reports: number;
  createdAt: string;
  lastSignIn: string;
};

type UsersResponse = {
  total: number;
  totalCredits: number;
  users: AdminUser[];
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [error, setError] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMsg, setGrantMsg] = useState("");

  const authenticated = Boolean(session);

  // Restore existing session (site owner logged in via Supabase)
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function authHeaders(): Record<string, string> {
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setAuthError("登录服务未配置。");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    const { data: result, error: loginError } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });
    if (loginError) {
      setAuthError(loginError.message === "Invalid login credentials" ? "邮箱或密码错误" : loginError.message);
    } else {
      setSession(result.session ?? null);
      setAuthPassword("");
    }
    setAuthBusy(false);
  }

  async function handleLogout() {
    await getBrowserSupabase()?.auth.signOut();
    setSession(null);
    setData(null);
  }

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/admin/users", { headers: authHeaders() });
      const json = await resp.json();
      if (resp.ok) {
        setData(json);
      } else {
        setError(json.error || "请求失败");
        if (resp.status === 401) setSession(null);
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setGrantMsg("");
    try {
      const resp = await fetch("/api/admin/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ email: grantEmail.trim(), credits: grantAmount }),
      });
      const json = await resp.json();
      if (resp.ok) {
        setGrantMsg(`✅ ${grantEmail}: ${json.before} → ${json.after} 星币 (+${json.added})`);
        setGrantEmail("");
        fetchUsers(); // refresh list
      } else {
        setGrantMsg(`❌ ${json.error || "操作失败"}`);
        if (resp.status === 401) setSession(null);
      }
    } catch {
      setGrantMsg("❌ 网络错误");
    }
  }

  useEffect(() => {
    if (authenticated) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  function formatDate(d: string) {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", { hour12: false });
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px" }}>🛡️ 星命局 · 管理后台</h1>
      <p style={{ color: "#6b7280", margin: "0 0 24px" }}>用户列表 · 星币管理</p>

      {checking ? (
        <p style={{ color: "#6b7280" }}>加载中...</p>
      ) : !authenticated ? (
        <div style={{ maxWidth: 420, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>站长登录</h2>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>使用你的星命局账号登录后进入后台</p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="站长邮箱"
              required
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="密码"
              required
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
            <button
              type="submit"
              disabled={authBusy || !authEmail || !authPassword}
              style={{ padding: "10px 0", border: "none", borderRadius: 6, background: "#171512", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              {authBusy ? "登录中..." : "登录"}
            </button>
          </form>
          {authError && <p style={{ color: "#dc2626", marginTop: 12, fontSize: 14 }}>{authError}</p>}
        </div>
      ) : (
        <>
          {/* Header bar with logout */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ color: "#374151", fontSize: 14 }}>
              已登录：<strong>{session?.user?.email || ""}</strong>
            </span>
            <button onClick={handleLogout} style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>退出登录</button>
          </div>

          {/* Grant credits section */}
          <form onSubmit={handleGrant} style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, padding: 16, border: "1px solid #fbbf24", borderRadius: 8, background: "#fffbeb", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 180px", minWidth: 160 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>邮箱</span>
              <input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} type="email" required placeholder="user@example.com" style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
            </label>
            <label style={{ flex: "0 0 100px" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>星币数</span>
              <input value={grantAmount} onChange={(e) => setGrantAmount(Number(e.target.value) || 0)} type="number" min={1} required style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
            </label>
            <button type="submit" style={{ flex: "0 0 auto", padding: "8px 18px", border: "none", borderRadius: 6, background: "#f59e0b", color: "#fff", fontWeight: 700, cursor: "pointer" }}>充值</button>
            {grantMsg && <span style={{ width: "100%", fontSize: 14, color: grantMsg.startsWith("✅") ? "#059669" : "#dc2626" }}>{grantMsg}</span>}
          </form>

          {/* Stats bar */}
          {data && (
            <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", flexWrap: "wrap" }}>
              <div><span style={{ color: "#6b7280", fontSize: 13 }}>总用户</span><strong style={{ display: "block", fontSize: 20 }}>{data.total}</strong></div>
              <div><span style={{ color: "#6b7280", fontSize: 13 }}>总星币流通</span><strong style={{ display: "block", fontSize: 20 }}>{data.totalCredits}</strong></div>
              <div style={{ marginLeft: "auto" }}>
                <button onClick={fetchUsers} disabled={loading} style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>{loading ? "刷新中..." : "🔄 刷新"}</button>
              </div>
            </div>
          )}

          {/* User table */}
          {data && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>邮箱</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>星币</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>报告数</th>
                    <th style={{ padding: "10px 12px" }}>最后登录</th>
                    <th style={{ padding: "10px 12px" }}>注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{u.email}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.credits}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{u.reports}</td>
                      <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(u.lastSignIn)}</td>
                      <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 13, whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>暂无用户</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {loading && <p style={{ textAlign: "center", color: "#6b7280", marginTop: 24 }}>加载中...</p>}
        </>
      )}
    </div>
  );
}
