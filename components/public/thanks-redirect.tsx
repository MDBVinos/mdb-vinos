"use client";

import { useEffect } from "react";

type ThanksRedirectProps = {
  to: string;
};

export function ThanksRedirect({ to }: ThanksRedirectProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = to;
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [to]);

  return null;
}
