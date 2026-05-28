import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "li";
};

export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: Props) {
  const reduced = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.8, delay: reduced ? 0 : delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05, margin: "200px 0px 200px 0px" }}

      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

