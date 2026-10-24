"use client";

import { useEffect, useState } from "react";

// El año se calcula en el navegador: Next no deja usar new Date() al prerenderizar
export default function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <>{year}</>;
}
