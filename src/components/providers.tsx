"use client";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#432516",
            color: "#fff8ec",
            borderRadius: "999px",
            padding: "10px 18px",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}
