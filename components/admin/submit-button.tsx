"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  disabled?: boolean;
  label: string;
  loadingLabel: string;
};

export function SubmitButton({ disabled = false, label, loadingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled}>
      {pending ? loadingLabel : label}
    </button>
  );
}
