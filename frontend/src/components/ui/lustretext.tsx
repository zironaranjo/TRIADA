import React from "react";

interface LustreTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  /** `dark` para fondos oscuros (hero, landing); `light` para fondos claros */
  variant?: 'light' | 'dark';
}

const LustreText: React.FC<LustreTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = '',
  variant = 'light',
}) => {
  const animationStyle = {
    animationDuration: `${speed}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationFillMode: 'forwards' as const,
  };

  const gradientClass = variant === 'dark' ? 'lustre-dark' : 'lustre-light';

  return (
    <span
      className={`lustre-text ${!disabled ? 'animate-shine' : ''} ${gradientClass} ${className}`}
      style={!disabled ? animationStyle : undefined}
    >
      {text}
    </span>
  );
};

export default LustreText;
