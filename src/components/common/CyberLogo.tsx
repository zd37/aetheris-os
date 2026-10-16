import React from 'react';

interface CyberLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const CyberLogo: React.FC<CyberLogoProps> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const sizeMap = {
    sm: {
      container: 'w-10 h-10',
      core: 'w-6 h-6 rounded-lg',
      iconSize: 'text-[16px]',
      strokeWidth: 1,
    },
    md: {
      container: 'w-16 h-16',
      core: 'w-9 h-9 rounded-xl',
      iconSize: 'text-[22px]',
      strokeWidth: 1.2,
    },
    lg: {
      container: 'w-28 h-28',
      core: 'w-14 h-14 rounded-2xl',
      iconSize: 'text-[28px]',
      strokeWidth: 1.2,
    },
    xl: {
      container: 'w-40 h-40',
      core: 'w-20 h-20 rounded-2xl',
      iconSize: 'text-[36px]',
      strokeWidth: 1.5,
    },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Outer ambient glow pool */}
        <div className="absolute inset-0 rounded-full bg-[#35d9ff]/10 blur-xl animate-pulse" />

        {/* Counter-rotating Orbital Ring 1 */}
        <svg
          className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80"
            cy="80"
            fill="none"
            r="74"
            stroke="#35d9ff"
            strokeDasharray="14 18 6 12"
            strokeOpacity="0.45"
            strokeWidth={config.strokeWidth}
          />
        </svg>

        {/* Counter-rotating Orbital Ring 2 (Reversed) */}
        <svg
          className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] animate-[spin_26s_linear_infinite_reverse]"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80"
            cy="80"
            fill="none"
            r="70"
            stroke="#cdbdff"
            strokeDasharray="6 22 18 10"
            strokeOpacity="0.35"
            strokeWidth={config.strokeWidth}
          />
        </svg>

        {/* Inner Tech Ring with Nodes */}
        <svg
          className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-[spin_14s_linear_infinite]"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            fill="none"
            r="54"
            stroke="#5cffb7"
            strokeDasharray="4 32"
            strokeOpacity="0.5"
            strokeWidth={config.strokeWidth}
          />
          <circle cx="60" cy="6" fill="#5cffb7" r="3" />
          <circle cx="60" cy="114" fill="#35d9ff" r="3" />
        </svg>

        {/* Central Sci-Fi Hex-Shield Core */}
        <div
          className={`relative ${config.core} bg-[#162338]/90 flex items-center justify-center shadow-xl backdrop-blur-md border border-[#35d9ff]/30`}
        >
          <div className="absolute inset-0.5 rounded-lg bg-gradient-to-tr from-[#502cb0]/40 via-[#0c1320] to-[#35d9ff]/20 pointer-events-none" />
          <span
            className={`material-symbols-outlined ${config.iconSize} text-[#35d9ff] relative z-10`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            token
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-3 text-center">
          <span className="font-bold tracking-tight text-[#edf5ff] text-base">
            AETHERIS <span className="text-[#35d9ff]">OS</span>
          </span>
          <p className="font-mono text-[10px] text-[#91a2b8] tracking-widest uppercase">
            Personal Life Telemetry
          </p>
        </div>
      )}
    </div>
  );
};
