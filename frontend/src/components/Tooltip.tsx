import { ReactNode } from 'react';

type TooltipProps = {
  text: string;
  children: ReactNode;
};

export function Tooltip({ text, children }: TooltipProps) {
  return(
    <div className="tooltip-container">
      {children}
      <div className="tooltip-box">
        {text}
      </div>
    </div>
  )
}