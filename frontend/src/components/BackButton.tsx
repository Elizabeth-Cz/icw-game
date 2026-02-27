"use client";

import React from "react";

type BackButtonProps = {
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  label?: string;
};

export default function BackButton({
  onClick,
  className,
  iconClassName,
  labelClassName,
  label = "Back",
}: BackButtonProps) {
  return (
    <button onClick={onClick} type="button" className='mr-auto flex items-center'>
      <span className={labelClassName} style={{ fontFamily: "var(--font-jersey-10)" }}>
        	&lt; {label}
      </span>
    </button>
  );
}
