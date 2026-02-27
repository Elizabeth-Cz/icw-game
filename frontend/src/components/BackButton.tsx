"use client";

import React from "react";
import { ArrowBigLeft } from "lucide-react";

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
      <ArrowBigLeft className={iconClassName ?? "mr-1 h-5 w-5"} />
      <span className={labelClassName} style={{ fontFamily: "var(--font-jersey-10)" }}>
        {label}
      </span>
    </button>
  );
}
