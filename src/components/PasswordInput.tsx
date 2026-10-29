"use client";

import { useState, type InputHTMLAttributes } from "react";

// A password box with a Show / Hide button, so people can check what they typed.
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} w-full pr-16`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted hover:text-foreground"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
