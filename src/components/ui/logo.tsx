"use client";

import Image from "next/image";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function Logo({ 
  className, 
  width = 24, 
  height = 24, 
  alt = "UbiGroup Logo" 
}: LogoProps) {
  const { theme } = useTheme();
  
  // Determine which logo to use based on theme
  const getLogoSrc = () => {
    if (theme === "dark") {
      return "/assets/logos/logo_dark.svg";
    } else if (theme === "light") {
      return "/assets/logos/logo_ligth.svg";
    } else {
      // For system theme, check the actual system preference
      if (typeof window !== "undefined") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return isDark ? "/assets/logos/logo_dark.svg" : "/assets/logos/logo_ligth.svg";
      }
      // Fallback to light theme
      return "/assets/logos/logo_ligth.svg";
    }
  };

  return (
    <Image
      src={getLogoSrc()}
      alt={alt}
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}
