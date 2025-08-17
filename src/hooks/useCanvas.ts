import { useState, useCallback } from 'react';

interface CanvasState {
  scale: number;
  panX: number;
  panY: number;
  isDrawingMode: boolean;
}

export function useCanvas() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    panX: 0,
    panY: 0,
    isDrawingMode: false,
  });

  const setScale = useCallback((scale: number) => {
    setCanvasState(prev => ({ ...prev, scale }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setCanvasState(prev => ({ ...prev, panX, panY }));
  }, []);

  const toggleDrawingMode = useCallback(() => {
    setCanvasState(prev => {
      const newMode = !prev.isDrawingMode;
      return { ...prev, isDrawingMode: newMode };
    });
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasState({
      scale: 1,
      panX: 0,
      panY: 0,
      isDrawingMode: false,
    });
  }, []);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(5, canvasState.scale * 1.2);
    setScale(newScale);
  }, [canvasState.scale, setScale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(0.1, canvasState.scale * 0.8);
    setScale(newScale);
  }, [canvasState.scale, setScale]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPan(0, 0);
  }, [setScale, setPan]);

  return {
    ...canvasState,
    setScale,
    setPan,
    toggleDrawingMode,
    resetCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
