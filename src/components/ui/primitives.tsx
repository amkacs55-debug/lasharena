import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none rounded-full";
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-[#FF4FA0] to-[#d43c86] text-white shadow-lg shadow-[#FF4FA0]/25 hover:shadow-[#FF4FA0]/50 hover:-translate-y-0.5",
    secondary:
      "bg-[#FFC7DD] text-[#1a0a12] hover:bg-white shadow-md shadow-black/20",
    outline:
      "border border-white/20 text-white hover:border-[#FF4FA0] hover:text-[#FF4FA0] bg-white/[0.03] backdrop-blur-sm",
    ghost: "text-white/80 hover:bg-white/10",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white",
  };
  const sizes: Record<string, string> = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-6 py-3",
    lg: "text-base px-8 py-4",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FF4FA0] focus:ring-2 focus:ring-[#FF4FA0]/25",
          className
        )}
        {...props}
      />
    );
  }
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FF4FA0] focus:ring-2 focus:ring-[#FF4FA0]/25",
          className
        )}
        {...props}
      />
    );
  }
);

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#B8B8B8]", className)}>
      {children}
    </label>
  );
}

export function Card({
  className,
  children,
  hover = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-[22px] card-shadow",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:border-[#FF4FA0]/40 hover:shadow-[#FF4FA0]/10",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "gold";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/10 text-white",
    success: "bg-emerald-400/15 text-emerald-300",
    warning: "bg-amber-400/15 text-amber-300",
    danger: "bg-red-400/15 text-red-300",
    gold: "bg-[#FF4FA0]/15 text-[#FF4FA0]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("mb-12", center && "text-center mx-auto max-w-2xl")}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.25em] text-[#FF4FA0]">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-[#B8B8B8] sm:text-lg">{subtitle}</p>}
    </motion.div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
      <p className="font-display text-xl text-white">{title}</p>
      {subtitle && <p className="mt-2 max-w-sm text-sm text-[#B8B8B8]">{subtitle}</p>}
    </div>
  );
}
