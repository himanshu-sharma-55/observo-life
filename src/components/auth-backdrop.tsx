export function AuthBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, #0a101c 0%, #121f35 38%, #1a2f4a 68%, #1e3d52 100%)",
        }}
      />

      <div
        className="absolute -left-[18%] top-[8%] h-[52%] w-[68%] rounded-full opacity-40 blur-3xl motion-safe:animate-[auth-drift_22s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(90, 154, 143, 0.55) 0%, rgba(90, 154, 143, 0) 68%)",
        }}
      />
      <div
        className="absolute -right-[12%] bottom-[6%] h-[48%] w-[58%] rounded-full opacity-35 blur-3xl motion-safe:animate-[auth-drift-alt_26s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(120, 168, 198, 0.45) 0%, rgba(120, 168, 198, 0) 70%)",
        }}
      />
      <div
        className="absolute left-[30%] top-[42%] h-[36%] w-[42%] rounded-full opacity-20 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 243, 239, 0.2) 0%, transparent 72%)",
        }}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="wm-teal" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#6db5a6" />
            <stop offset="1" stopColor="#3d7a6f" />
          </linearGradient>
          <linearGradient id="wm-top" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#b8d4e0" />
            <stop offset="1" stopColor="#5a9e92" />
          </linearGradient>
        </defs>
        <g transform="translate(420, 280) scale(3.2)">
          <path d="M5 30Q17 20.5 29 30Z" fill="#1e2d4a" />
          <path d="M8 25.5Q17 18.5 26 25.5Z" fill="url(#wm-teal)" />
          <path d="M11 22Q17 17.2 23 22Z" fill="#8fa4b4" />
          <circle cx="17" cy="15.2" r="3.35" fill="url(#wm-top)" />
        </g>
        <g transform="translate(120, 620) scale(2.1) rotate(-8)">
          <path d="M5 30Q17 20.5 29 30Z" fill="#1e2d4a" />
          <path d="M8 25.5Q17 18.5 26 25.5Z" fill="url(#wm-teal)" />
          <path d="M11 22Q17 17.2 23 22Z" fill="#8fa4b4" />
          <circle cx="17" cy="15.2" r="3.35" fill="url(#wm-top)" />
        </g>
      </svg>

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(0,0,0,0.18))]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%221%22/></svg>')]" />
    </>
  );
}
