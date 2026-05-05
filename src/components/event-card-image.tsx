"use client";

import { useState } from "react";

type Props = {
  title: string;
  primarySrc: string;
};

/**
 * Picsum is stable, but some networks block CDNs; we chain a placeholder image,
 * then a text gradient so the card never shows a broken icon.
 */
export function EventCardImage({ title, primarySrc }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const fallbackPhoto = `https://placehold.co/800x450/F5F5F4/57534E/jpg?text=${encodeURIComponent(
    title.length > 42 ? `${title.slice(0, 40)}…` : title,
  )}`;

  if (step >= 2) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-400 px-4 text-center text-sm font-medium leading-snug text-stone-800">
        {title}
      </div>
    );
  }

  const src = step === 0 ? primarySrc : fallbackPhoto;

  return (
    <div className="aspect-[16/9] w-full overflow-hidden bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() =>
          setStep((s) => Math.min(2, s + 1) as 0 | 1 | 2)
        }
      />
    </div>
  );
}
