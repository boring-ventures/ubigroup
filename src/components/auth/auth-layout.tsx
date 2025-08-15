import Image from "next/image";
import logoLight from "@logos/logo_ligth.svg";
import logoDark from "@logos/logo_dark.svg";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Image
            src={logoLight}
            alt="UbiGroup logo"
            width={40}
            height={40}
            className="h-10 w-auto dark:hidden"
            priority
          />
          <Image
            src={logoDark}
            alt="UbiGroup logo"
            width={40}
            height={40}
            className="hidden h-10 w-auto dark:block"
            priority
          />
          <h1 className="text-xl font-medium">UbiGroup</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
