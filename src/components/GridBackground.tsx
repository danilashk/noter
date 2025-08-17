'use client';

import React from 'react';

interface GridBackgroundProps {
  scale: number;
  panX: number;
  panY: number;
}

export function GridBackground({ scale, panX, panY }: GridBackgroundProps) {
  // Размер ячейки сетки в пикселях
  const gridSize = 20;
  
  // Вычисляем масштабированный размер сетки
  const scaledGridSize = gridSize * scale;
  
  // Вычисляем смещение для бесшовного повторения
  const offsetX = panX % scaledGridSize;
  const offsetY = panY % scaledGridSize;
  
  // Определяем прозрачность в зависимости от масштаба
  const getOpacity = () => {
    if (scale < 0.3) return 0; // Скрываем сетку при сильном уменьшении
    if (scale < 0.6) return 0.1;
    if (scale < 1) return 0.15;
    if (scale < 2) return 0.2;
    return 0.25;
  };
  
  const opacity = getOpacity();
  
  if (opacity === 0) return null;
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: opacity,
        zIndex: 0,
      }}
    />
  );
}