import React from "react";

interface SectionSeparatorProps {
  className?: string;
}

export const SectionSeparator: React.FC<SectionSeparatorProps> = ({
  className = "",
}) => {
  return (
    <div className={`w-full py-8 lg:py-12 ${className}`}>
      <div className="container mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
      </div>
    </div>
  );
};

export default SectionSeparator;
