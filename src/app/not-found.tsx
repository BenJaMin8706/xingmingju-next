import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 72, margin: 0, color: "#7c3aed" }}>404</h1>
      <p style={{ color: "#666", fontSize: 18, marginTop: 8 }}>
        页面不存在
      </p>
      <Link
        href="/"
        style={{
          marginTop: 24,
          padding: "12px 24px",
          borderRadius: 8,
          background: "#7c3aed",
          color: "#fff",
          fontSize: 16,
          textDecoration: "none",
        }}
      >
        返回首页
      </Link>
    </div>
  );
}
