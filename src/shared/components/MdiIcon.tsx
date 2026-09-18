import React from "react";

export interface MdiIconProps extends React.SVGProps<SVGSVGElement> {
  path: string;
  size?: number | string;
  color?: string;
  className?: string;
}

export const MdiIcon: React.FC<MdiIconProps> = ({
  path,
  size = 16,
  color = "currentColor",
  className = "w-4 h-4 shrink-0",
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={color}
      aria-hidden="true"
      {...props}
    >
      <path d={path} />
    </svg>
  );
};
