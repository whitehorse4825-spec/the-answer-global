export default function DanchungOrnament() {
  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 200 200"
        className="danchung-ring danchung-glow w-full h-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dan-grad" x1="40" y1="10" x2="160" y2="190">
            <stop offset="0" stopColor="#C53030" stopOpacity="1" />
            <stop offset="0.55" stopColor="#2B6CB0" stopOpacity="0.95" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <circle
          cx="100"
          cy="100"
          r="76"
          stroke="url(#dan-grad)"
          strokeWidth="2.6"
          className="danchung-stroke"
        />

        {/* Stylized danchung "burst" */}
        <path
          d="M100 22
             L115 60
             L156 63
             L124 90
             L135 129
             L100 110
             L65 129
             L76 90
             L44 63
             L85 60
             Z"
          stroke="#D4AF37"
          strokeWidth="2.2"
          className="danchung-stroke"
          strokeLinejoin="round"
        />

        {/* Center medallion */}
        <circle
          cx="100"
          cy="100"
          r="38"
          stroke="#2B6CB0"
          strokeWidth="2.2"
          className="danchung-stroke"
        />

        {/* Inner strokes */}
        <path
          d="M52 100
             C66 74, 92 60, 120 62
             M148 100
             C132 126, 108 138, 80 136"
          stroke="#C53030"
          strokeWidth="2.2"
          className="danchung-stroke"
          strokeLinecap="round"
        />

        {/* Subtle glints */}
        <circle cx="54" cy="88" r="3" fill="#D4AF37" opacity="0.65" />
        <circle cx="140" cy="72" r="2.6" fill="#2B6CB0" opacity="0.55" />
        <circle cx="128" cy="138" r="2.8" fill="#C53030" opacity="0.55" />
      </svg>
    </div>
  );
}

