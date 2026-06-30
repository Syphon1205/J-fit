import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, CheckCircle2, Footprints, Wind } from "lucide-react";

export type TimelineHour = {
  time: string;
  temp: number;
  windMph: number;
  score: number;
  optimal?: boolean;
};

export type TrainingWindowData = {
  title: string;
  window: string;
  summary: string;
  details: string[];
  hours: TimelineHour[];
};

type TrainingWindowProps = {
  data: TrainingWindowData;
  onScheduleRun?: () => void;
};

export function TrainingWindow({ data, onScheduleRun }: TrainingWindowProps) {
  return (
    <section style={styles.card}>
      <div style={styles.glow} />
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.iconWrap}>
            <Footprints size={22} color="#CCFF00" strokeWidth={2.4} />
          </div>
          <div>
            <div style={styles.eyebrow}>Optimal Window Engine</div>
            <h2 style={styles.title}>{data.title}</h2>
          </div>
        </div>
        <motion.button
          style={styles.button}
          onClick={onScheduleRun}
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.97 }}
        >
          <CalendarPlus size={17} color="#050505" strokeWidth={2.5} />
          Schedule Run
        </motion.button>
      </div>

      <p style={styles.summary}>{data.summary}</p>
      <div style={styles.detailRow}>
        {data.details.map((detail) => (
          <span key={detail} style={styles.detailChip}>
            <CheckCircle2 size={14} color="#CCFF00" strokeWidth={2.4} />
            {detail}
          </span>
        ))}
      </div>

      <div style={styles.timelineHeader}>
        <span>Today</span>
        <span style={{ color: "#CCFF00" }}>{data.window}</span>
      </div>
      <div style={styles.timeline}>
        {data.hours.map((hour) => (
          <div key={hour.time} style={styles.hourShell}>
            <div style={hour.optimal ? styles.hourOptimal : styles.hour}>
              <div
                style={{
                  ...styles.scoreBar,
                  height: `${Math.max(10, hour.score)}%`,
                  background: hour.optimal ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.12)",
                }}
              />
              <div style={styles.hourContent}>
                <div style={styles.hourTime}>{hour.time}</div>
                <div style={styles.hourTemp}>{hour.temp}°</div>
                <div style={styles.windLine}>
                  <Wind size={12} color={hour.optimal ? "#050505" : "rgba(255,255,255,0.58)"} />
                  {hour.windMph}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
};

const styles: Record<string, CSSProperties> = {
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 32,
    padding: 22,
    color: "#fff",
    ...glass,
    boxShadow: "0 28px 90px rgba(0,0,0,0.38)",
  },
  glow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 0%, rgba(204,255,0,0.18), transparent 32%), radial-gradient(circle at 90% 80%, rgba(0,209,255,0.11), transparent 34%)",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  titleGroup: { display: "flex", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(204,255,0,0.14)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  title: {
    margin: "5px 0 0",
    color: "#fff",
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 750,
    letterSpacing: "-0.045em",
  },
  button: {
    border: 0,
    borderRadius: 999,
    minHeight: 48,
    padding: "0 20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#CCFF00",
    color: "#050505",
    fontSize: 14,
    fontWeight: 850,
    boxShadow: "0 0 36px rgba(204,255,0,0.38)",
  },
  summary: {
    position: "relative",
    margin: "18px 0 0",
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 1.5,
    fontWeight: 560,
  },
  detailRow: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  detailChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    padding: "9px 11px",
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: 650,
    ...glass,
  },
  timelineHeader: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  timeline: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(54px, 1fr))",
    gap: 7,
    overflowX: "auto",
    borderRadius: 24,
    padding: 10,
    background: "rgba(0,0,0,0.22)",
  },
  hourShell: { minWidth: 54 },
  hour: {
    position: "relative",
    overflow: "hidden",
    height: 86,
    borderRadius: 18,
    padding: 9,
    background: "rgba(255,255,255,0.055)",
    color: "rgba(255,255,255,0.68)",
  },
  hourOptimal: {
    position: "relative",
    overflow: "hidden",
    height: 86,
    borderRadius: 18,
    padding: 9,
    color: "#050505",
    background: "linear-gradient(180deg, #CCFF00 0%, #7CFF4D 100%)",
    boxShadow: "0 0 28px rgba(204,255,0,0.36)",
  },
  scoreBar: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 999,
  },
  hourContent: { position: "relative", zIndex: 1 },
  hourTime: { fontSize: 10, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em" },
  hourTemp: { marginTop: 12, fontSize: 19, fontWeight: 800 },
  windLine: { marginTop: 4, display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 750 },
};
