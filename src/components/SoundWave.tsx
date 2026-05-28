import { motion, useReducedMotion } from "framer-motion";

type Props = { className?: string; tint?: string };

/** Hengittävä sointuaalto-SVG, käytetään aksenttina otsikoiden vieressä */
export function SoundWave({ className, tint = "currentColor" }: Props) {
  const reduced = useReducedMotion();
  const bars = [10, 18, 28, 22, 14, 24, 16, 8];
  return (
    <svg
      viewBox="0 0 120 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={i * 14 + 2}
          y={20 - h / 2}
          width={3}
          height={h}
          rx={1.5}
          fill={tint}
          initial={{ scaleY: 0.4, opacity: 0.4 }}
          animate={
            reduced
              ? { scaleY: 1, opacity: 0.7 }
              : {
                  scaleY: [0.4, 1, 0.6, 1, 0.4],
                  opacity: [0.4, 0.9, 0.6, 0.9, 0.4],
                }
          }
          transition={{
            duration: 3.6,
            delay: i * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      ))}
    </svg>
  );
}
