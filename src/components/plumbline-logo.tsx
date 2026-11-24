import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/plumbline-logo.png";

type PlumblineLogoProps = { href?: string; className?: string };

export function PlumblineLogo({ href = "/", className = "h-8 w-auto" }: PlumblineLogoProps) {
  return (
    <Link href={href} className="tap-target z-10 inline-flex shrink-0 self-start">
      {/* Inverting turns the black lettering white; rotating the hue back keeps the plumb bob orange. */}
      <Image src={logo} alt="Plumbline" className={`${className} dark:invert dark:hue-rotate-180`} loading="eager" />
    </Link>
  );
}
