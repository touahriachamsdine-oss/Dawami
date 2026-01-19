import type { SVGProps } from "react";

export function AtProfitLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.png"
      alt="Logo"
      {...props}
      className={`object-contain ${props.className || ''}`}
    />
  );
}
