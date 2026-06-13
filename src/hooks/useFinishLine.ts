import { useCallback, useEffect, useState } from "react";
import type { FinishLine } from "../types";
import { clearFinishLine, loadFinishLine, saveFinishLine } from "../storage/finishLineStorage";

export function useFinishLine() {
  const [finishLine, setFinishLineState] = useState<FinishLine | null>(null);

  useEffect(() => {
    setFinishLineState(loadFinishLine());
  }, []);

  const setFinishLine = useCallback((line: FinishLine) => {
    saveFinishLine(line);
    setFinishLineState(line);
  }, []);

  const resetFinishLine = useCallback(() => {
    clearFinishLine();
    setFinishLineState(null);
  }, []);

  return { finishLine, setFinishLine, resetFinishLine };
}
