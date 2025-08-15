"use client";

import React from "react";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  Building,
  Briefcase,
  Globe,
  Laptop,
  Lightbulb,
  Rocket,
  Target,
  Zap,
  Brain,
  Heart,
} from "lucide-react";

const companies = [
  { name: "TechCorp", icon: Building },
  { name: "InnovateLabs", icon: Lightbulb },
  { name: "MindfulCo", icon: Brain },
  { name: "FutureWorks", icon: Rocket },
  { name: "ZenithHealth", icon: Heart },
  { name: "GlobalTech", icon: Globe },
  { name: "SmartSolutions", icon: Laptop },
  { name: "PowerInnovate", icon: Zap },
  { name: "TargetAchievers", icon: Target },
  { name: "BizPro", icon: Briefcase },
];

export default function SocialProof() {
  const controls = useAnimation();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % companies.length);
    }, 3000); // Change company every 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    controls.start({
      opacity: [0, 1, 1, 0],
      y: [20, 0, 0, -20],
      transition: { duration: 2.5, times: [0, 0.1, 0.9, 1] },
    });
  }, [controls]);

  return (
    <section className="py-16 bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Trusted by Leading Organizations
        </h2>
        <div className="flex justify-center items-center h-24 overflow-hidden">
          <motion.div
            key={currentIndex}
            animate={controls}
            className="flex flex-col items-center text-center px-4"
          >
            {React.createElement(companies[currentIndex].icon, {
              size: 48,
              className: "text-primary mb-2",
            })}
            <span className="text-lg font-semibold text-foreground">
              {companies[currentIndex].name}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
