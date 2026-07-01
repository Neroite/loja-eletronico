"use client";

import { useState, useEffect } from "react";

const PREFIX = "byteflow:";

function readLocal(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? (JSON.parse(raw) as string) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

export function useStoreConfig() {
  const [storeName, setStoreNameState] = useState("ByteFlow Pro");
  const [storeSegment, setStoreSegmentState] = useState(
    "Eletrônicos & Informática",
  );

  useEffect(() => {
    setStoreNameState(readLocal("storeName", "ByteFlow Pro"));
    setStoreSegmentState(
      readLocal("storeSegment", "Eletrônicos & Informática"),
    );
  }, []);

  const setStoreName = (v: string) => {
    setStoreNameState(v);
    writeLocal("storeName", v);
  };

  const setStoreSegment = (v: string) => {
    setStoreSegmentState(v);
    writeLocal("storeSegment", v);
  };

  return { storeName, storeSegment, setStoreName, setStoreSegment };
}
