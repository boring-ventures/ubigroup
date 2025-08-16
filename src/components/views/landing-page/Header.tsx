"use client";

import React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import logoLight from "@logos/logo_ligth.svg";
import logoDark from "@logos/logo_dark.svg";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

// Button component (from shadcn/ui)
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const menuItems = [
  { name: "Propiedades", href: "/#properties" },
  { name: "Proyectos", href: "/?tab=proyectos#properties" },
  { name: "¡Vende tu propiedad!", href: "/#capture-banner" },
];

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full top-0 left-0 right-0"
      >
        <div className="container">
          <div
            className={cn(
              "mx-auto transition-all duration-700 ease-out px-4 sm:px-6 lg:px-8",
              isScrolled
                ? "bg-background/50 rounded-2xl border backdrop-blur-lg mt-2 sm:mt-3 shadow-lg"
                : "mt-2 sm:mt-3"
            )}
            style={{
              transition: "all 700ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              className={cn(
                "relative flex flex-wrap items-center justify-between gap-6 lg:gap-0 transition-all duration-700 ease-out",
                isScrolled ? "py-4 sm:py-5 lg:py-4" : "py-3 lg:py-4"
              )}
            >
              <div className="flex w-full justify-between lg:w-auto">
                <Link
                  href="/"
                  aria-label="home"
                  className="flex items-center space-x-2"
                >
                  <Logo />
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-foreground"
                >
                  <Menu
                    className={cn(
                      "m-auto size-6 duration-200",
                      menuState
                        ? "rotate-180 scale-0 opacity-0"
                        : "rotate-0 scale-100 opacity-100"
                    )}
                  />
                  <X
                    className={cn(
                      "absolute inset-0 m-auto size-6 duration-200",
                      menuState
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-180 scale-0 opacity-0"
                    )}
                  />
                </button>
              </div>

              <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-foreground hover:text-primary block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={cn(
                  "bg-background mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 dark:shadow-zinc-800/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent",
                  menuState ? "block" : "hidden",
                  "lg:flex"
                )}
              >
                <div className="lg:hidden">
                  <ul className="space-y-6 text-base">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-foreground hover:text-primary block duration-150"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                  {!isLoading && (
                    <>
                      {!user ? (
                        <Link href="/sign-in">
                          <Button size="sm">
                            <span>Sign In</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/dashboard">
                          <Button size="sm">
                            <span>Go to Dashboard</span>
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src={logoLight}
        alt="UbiGroup logo"
        width={32}
        height={32}
        className="h-8 w-auto dark:hidden"
        priority
      />
      <Image
        src={logoDark}
        alt="UbiGroup logo"
        width={32}
        height={32}
        className="hidden h-8 w-auto dark:block"
        priority
      />
    </div>
  );
};

export default function Header() {
  return <HeroHeader />;
}
