import Link from "next/link";
import Image from "next/image";
import { FacebookIcon, TwitterIcon, InstagramIcon } from "lucide-react";
import logoLight from "@logos/logo_ligth.svg";
import logoDark from "@logos/logo_dark.svg";

export default function Footer() {
  return (
    <footer className="bg-secondary text-foreground py-12">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
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
              <span className="text-2xl font-bold text-primary">UbiGroup</span>
            </div>
            <p className="text-muted-foreground">
              Empowering minds for a better tomorrow.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/positivenext"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FacebookIcon size={24} />
              </a>
              <a
                href="https://twitter.com/positivenext"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <TwitterIcon size={24} />
              </a>
              <a
                href="https://instagram.com/positivenext"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <InstagramIcon size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} UbiGroup. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Desarrollado por Boring Studios
          </p>
        </div>
      </div>
    </footer>
  );
}
