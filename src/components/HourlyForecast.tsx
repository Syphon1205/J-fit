import type { CSSProperties } from "react";
import { CloudRain, CloudSun, Moon, Sun, Wind } from "lucide-react";

export type HourlyForecastPoint = {
  time: string;
  temp: number;
  precipitation: number;
  condition: "sun" | "cloud-sun" | "rain" | "moon";
  windMph: number;
};

type HourlyForecastProps = {
  hours: HourlyForecastPoint[];
};

const iconMap = {
  sun: Sun,
  "cloud-sun": CloudSun,
  rain: CloudRain,
  moon: Moon,
};

export function HourlyForecast({ hours }: HourlyForecastProps) {
  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Hourly Forecast</div>
          <h2 style={styles.title}>Oklahoma City micro-climate ribbon</h2>
        </div>
        <Wind size={20} color="rgba(255,255,255,0.35)" />
      </div>

      <div style={styles.ribbon}>
        {hours.map((hour) => {
          const Icon = iconMap[hour.condition];
          return (
            <article key={hour.time} style={styles.hour}>
              <div style={styles.time}>{hour.time}</div>
              <Icon size={29} color="#CCFF00" strokeWidth={2.2} style={{ marginTop: 15 }} />
              <div style={styles.temp}>{hour.temp}°</div>
              <div style={styles.wind}>{hour.windMph} mph</div>
              <div style={styles.precipShell}>
                <div style={styles.precipTrack}>
                  <div
                    style={{
                      ...styles.precipBar,
                      height: `${Math.max(8, hour.precipitation)}%`,
                    }}
                    title={`${hour.precipitation}% precipitation`}
                  />
                </div>
              </div>
              <div style={styles.precipText}>{hour.precipitation}%</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    borderRadius: 32,
    padding: 20,
    color: "#fff",
    background: "rgba(255,255,255,0.055)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 },
  eyebrow: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  title: {
    margin: "5px 0 0",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1.15,
    fontWeight: 760,
    letterSpacing: "-0.035em",
  },
  ribbon: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    paddingBottom: 2,
  },
  hour: {
    minWidth: 86,
    scrollSnapAlign: "start",
    borderRadius: 24,
    padding: "15px 12px",
    textAlign: "center",
    background: "rgba(255,255,255,0.055)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
  },
  time: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },
  temp: { marginTop: 12, color: "#fff", fontSize: 28, fontWeight: 250, letterSpacing: "-0.06em" },
  wind: { marginTop: 3, color: "rgba(255,255,255,0.42)", fontSize: 10 },
  precipShell: { marginTop: 15, height: 48, borderRadius: 999, background: "rgba(0,0,0,0.26)", padding: 4 },
  precipTrack: { height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" },
  precipBar: {
    width: 12,
    borderRadius: 999,
    background: "linear-gradient(180deg, #CCFF00 0%, #00D1FF 100%)",
  },
  precipText: { marginTop: 7, color: "rgba(255,255,255,0.46)", fontSize: 10 },
};
