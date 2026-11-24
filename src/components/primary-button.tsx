import type { ButtonHTMLAttributes } from "react";

export const primaryButtonClass =
  "rounded-field bg-accent px-6 py-3 font-semibold text-on-accent transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-text";

export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${primaryButtonClass} ${className ?? ""}`} {...props} />;
}
