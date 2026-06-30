import type { CSSProperties } from "react";
import { Droplets, MapPin, Thermometer, Wind } from "lucide-react";

export type CurrentWeatherData = {
  city: string;
  observedAt: string;
  condition: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewpoint: number;
  wind: string;
};

type CurrentWeatherProps = {
  weather: CurrentWeatherData;
};

export function CurrentWeather({ weather }: CurrentWeatherProps) {
  const metrics = [
    { label: "Humidity", value: `${weather.humidity}%`, icon: Droplets },
    { label: "Dewpoint", value: `${weather.dewpoint}°`, icon: Thermometer },
    { label: "Wind", value: weather.wind, icon: Wind },
  ];

  return (
    <section style={styles.card}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />
      <div style={styles.topRow}>
        <div>
          <div style={styles.location}>
            <MapPin size={16} color="#CCFF00" strokeWidth={2.4} />
            <span>{weather.city}</span>
          </div>
          <div style={styles.temperature}>{weather.temperature}°</div>
          <div style={styles.conditionRow}>
            <span style={styles.condition}>{weather.condition}</span>
            <span style={styles.dot} />
            <span style={styles.feels}>Feels like {weather.feelsLike}°</span>
          </div>
        </div>
        <div style={styles.observed}>{weather.observedAt}</div>
      </div>

      <div style={styles.metrics}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} style={styles.metricCard}>
              <Icon size={18} color="#CCFF00" strokeWidth={2.2} />
              <div style={styles.metricLabel}>{metric.label}</div>
              <div style={styles.metricValue}>{metric.value}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
};

const styles: Record<string, CSSProperties> = {
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 32,
    padding: 24,
    color: "#fff",
    background:
      "radial-gradient(circle at 78% 10%, rgba(204,255,0,0.15), transparent 34%), radial-gradient(circle at 12% 88%, rgba(59,130,246,0.22), transparent 38%), linear-gradient(135deg, #0A0F18 0%, #101827 48%, #050505 100%)",
    boxShadow: "0 32px 120px rgba(0,0,0,0.48)",
  },
  glowOne: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.42) 100%)",
    pointerEvents: "none",
  },
  glowTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    right: -60,
    top: -70,
    borderRadius: 999,
    background: "rgba(204,255,0,0.12)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  topRow: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  location: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  temperature: {
    marginTop: 18,
    fontSize: 76,
    lineHeight: "0.9",
    fontWeight: 200,
    letterSpacing: "-0.07em",
  },
  conditionRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
  },
  condition: { fontSize: 17, fontWeight: 700 },
  dot: { width: 4, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.48)" },
  feels: { fontSize: 13, color: "rgba(255,255,255,0.62)" },
  observed: {
    ...glass,
    borderRadius: 999,
    padding: "9px 12px",
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  metrics: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 26,
  },
  metricCard: {
    ...glass,
    borderRadius: 22,
    padding: 13,
  },
  metricLabel: {
    marginTop: 12,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.17em",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 4,
    color: "#fff",
    fontSize: 17,
    fontWeight: 750,
    letterSpacing: "-0.02em",
  },
};
