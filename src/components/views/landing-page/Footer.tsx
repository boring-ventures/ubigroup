import Link from "next/link";
import Image from "next/image";
import { FacebookIcon, InstagramIcon } from "lucide-react";
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
                alt="Logo de UbiGroup"
                width={32}
                height={32}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src={logoDark}
                alt="Logo de UbiGroup"
                width={32}
                height={32}
                className="hidden h-8 w-auto dark:block"
                priority
              />
              <span className="text-2xl font-bold text-primary">UbiGroup</span>
            </div>
            <p className="text-muted-foreground">
              Encontrando hogares ideales para un mejor mañana.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Acerca de
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Testimonios
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
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Conectar</h4>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/share/16wB32VVbZ/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FacebookIcon size={24} />
              </a>
              <a
                href="https://www.tiktok.com/@ubigroup.bol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/ubigroup.bol/"
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
