"use client";

import { useEffect, useState } from "react";

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
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [error, setError] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMsg, setGrantMsg] = useState("");

  // Restore key from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("admin-key");
    if (saved) {
      setKey(saved);
      setAuthenticated(true);
    }
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/admin/users", {
        headers: { "x-admin-key": key },
      });
      const json = await resp.json();
      if (resp.ok) {
        setData(json);
        sessionStorage.setItem("admin-key", key);
        setAuthenticated(true);
      } else {
        setError(json.error || "请求失败");
        setAuthenticated(false);
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
          "x-admin-key": key,
        },
        body: JSON.stringify({ email: grantEmail.trim(), credits: grantAmount }),
      });
      const json = await resp.json();
      if (resp.ok) {
        setGrantMsg(`✅ ${grantEmail}: ${json.before} → ${json.after} 星币 (+${json.added})`);
        setGrantEmail("");
        fetchUsers(); // refresh list
      } else {
        setGrantMsg(`❌ ${json.error}`);
      }
    } catch {
      setGrantMsg("❌ 网络错误");
    }
  }

  useEffect(() => {
    if (authenticated && key) fetchUsers();
  }, [authenticated, key]);

  function formatDate(d: string) {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", { hour12: false });
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px" }}>🛡️ 星命局 · 管理后台</h1>
      <p style={{ color: "#6b7280", margin: "0 0 24px" }}>用户列表 · 星币管理</p>

      {!authenticated ? (
        <div style={{ maxWidth: 420, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>管理员密钥</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入 ADMIN_API_KEY"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
          />
          <button
            onClick={fetchUsers}
            disabled={!key}
            style={{ width: "100%", marginTop: 12, padding: "10px 0", border: "none", borderRadius: 6, background: key ? "#171512" : "#d1d5db", color: "#fff", fontWeight: 700, cursor: key ? "pointer" : "default" }}
          >
            验证并进入
          </button>
          {error && <p style={{ color: "#dc2626", marginTop: 12, fontSize: 14 }}>{error}</p>}
        </div>
      ) : (
        <>
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
