"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <h1 style={{ fontSize: 48, margin: 0 }}>出错了</h1>
      <p style={{ color: "#666", maxWidth: 400 }}>
        页面加载时发生了意外错误，请重试。如果反复出现，请把下面的错误编号发给站长。
      </p>
      {error.digest && (
        <p style={{ color: "#999", fontSize: 12, margin: "4px 0 0" }}>
          错误编号：{error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: 16,
          padding: "12px 24px",
          border: "none",
          borderRadius: 8,
          background: "#7c3aed",
          color: "#fff",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        重试
      </button>
    </div>
  );
}
