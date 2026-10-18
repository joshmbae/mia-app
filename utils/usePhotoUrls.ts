import { useEffect, useState } from "react";
import { resolvePhotoUrls } from "./storage";

/** Löst Foto-Referenzen in anzeigbare URLs auf; aktualisiert sich, wenn sich die Liste ändert */
export function usePhotoUrls(refs: (string | undefined)[]): Record<string, string> {
  const list = refs.filter((r): r is string => !!r);
  const key = list.join("|");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    if (list.length === 0) {
      setUrls({});
      return;
    }
    resolvePhotoUrls(list)
      .then((res) => alive && setUrls(res))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
