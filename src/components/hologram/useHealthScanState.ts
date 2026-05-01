import { useState, useEffect, useCallback } from 'react';

export type ScanState = 'idle' | 'scanning-down' | 'scanning-up' | 'calculating' | 'complete';

interface UseHealthScanStateReturn {
  scanState: ScanState;
  progress: number;
  startScan: () => void;
  resetScan: () => void;
  triggerCalculating: () => void;
  completeScan: () => void;
}

export function useHealthScanState(): UseHealthScanStateReturn {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Handle automatic state transitions
  useEffect(() => {
    if (scanState === 'scanning-down') {
      // Animate progress from 0% to 50% over 2.4 seconds (20% faster)
      const interval = setInterval(() => {
        const elapsed = Date.now() - (startTime || Date.now());
        const newProgress = Math.min((elapsed / 2400) * 50, 50);
        setProgress(newProgress);
      }, 16); // ~60fps

      // Transition to scanning-up after 2.4 seconds
      const timeout = setTimeout(() => {
        setScanState('scanning-up');
      }, 2400);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    if (scanState === 'scanning-up') {
      // Animate progress from 50% to 100% over 2.4 seconds (20% faster)
      const scanUpStartTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - scanUpStartTime;
        const newProgress = Math.min(50 + (elapsed / 2400) * 50, 100);
        setProgress(newProgress);
      }, 16); // ~60fps

      // Loop back to scanning-down so the scan keeps running until the consumer
      // explicitly calls completeScan(), resetScan(), or triggerCalculating().
      const timeout = setTimeout(() => {
        setScanState('scanning-down');
        setProgress(0);
        setStartTime(Date.now());
      }, 2400);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [scanState, startTime]);

  const startScan = useCallback(() => {
    setScanState('scanning-down');
    setProgress(0);
    setStartTime(Date.now());
  }, []);

  const resetScan = useCallback(() => {
    setScanState('idle');
    setProgress(0);
    setStartTime(null);
  }, []);

  const triggerCalculating = useCallback(() => {
    setScanState('calculating');
    setProgress(100);
  }, []);

  const completeScan = useCallback(() => {
    setScanState('idle');  // Return to idle - hasCompletedScan tracks completion
    setProgress(100);
  }, []);

  return {
    scanState,
    progress,
    startScan,
    resetScan,
    triggerCalculating,
    completeScan,
  };
}
