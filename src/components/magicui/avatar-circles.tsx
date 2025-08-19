"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AvatarCirclesProps {
  numProperties: number;
  propertyUrls?: Array<{
    imageUrl: string;
    propertyUrl?: string;
  }>;
  className?: string;
}

export function AvatarCircles({
  numProperties,
  propertyUrls = [],
  className = "",
}: AvatarCirclesProps) {
  // Generate placeholder property images if not enough provided
  const allProperties =
    propertyUrls.length >= 5
      ? propertyUrls
      : [
          ...propertyUrls,
          ...Array.from({ length: 5 - propertyUrls.length }, (_, i) => ({
            imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=150&h=150&fit=crop&crop=entropy`,
            propertyUrl: undefined,
          })),
        ];

  const displayProperties = allProperties.slice(0, 5);

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Property circles */}
      <div className="flex -space-x-1 sm:-space-x-2">
        {displayProperties.map((property, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.3,
              type: "spring",
              stiffness: 200,
            }}
            className="relative"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-primary/20 overflow-hidden bg-muted">
              <Image
                src={property.imageUrl}
                alt={`Propiedad ${index + 1}`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        ))}

        {/* Plus circle for remaining properties */}
        {numProperties > 5 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.5,
              duration: 0.3,
              type: "spring",
              stiffness: 200,
            }}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center"
          >
            <span className="text-xs font-semibold text-primary-foreground">
              +{numProperties - 5}
            </span>
          </motion.div>
        )}
      </div>

      {/* Trust text */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="text-xs sm:text-sm text-muted-foreground"
      >
        más de{" "}
        <span className="font-medium text-primary">
          {numProperties.toLocaleString()}
        </span>{" "}
        propiedades para comercializar
      </motion.div>
    </div>
  );
}
