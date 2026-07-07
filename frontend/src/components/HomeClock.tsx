"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function HomeClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center" style={{ gap: 8 }}>
      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          lineHeight: "40px",
          letterSpacing: "0.37px",
          color: "#232333",
        }}
      >
        {format(now, "h:mm a")}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "20px",
          color: "rgba(4, 4, 19, 0.56)",
        }}
      >
        {format(now, "EEEE, MMMM d")}
      </div>
    </div>
  );
}
