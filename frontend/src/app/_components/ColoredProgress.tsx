import React from "react";
import { Progress } from "@/components/ui/progress";

interface ColoredProgressProps {
  value: number;
  color: string;
  className?: string;
}

export const ColoredProgress: React.FC<ColoredProgressProps> = ({
  value,
  color,
  className,
}) => {
  return (
    <Progress
      value={value}
      className={className}
      style={
        {
          "--progress-color": color,
        } as React.CSSProperties
      }
    />
  );
};
