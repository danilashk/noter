'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getMutedColor } from '@/lib/colors';

interface Point {
  x: number;
  y: number;
}

interface DrawingLine {
  id: string;
  points: Point[];
  color: string;
  createdBy: string;
}

interface DrawingCanvasProps {
  isDrawingMode: boolean;
  scale: number;
  panX: number;
  panY: number;
  onPanChange: (panX: number, panY: number) => void;
  onScaleChange: (scale: number) => void;
  userColor?: string;
  onCreateCard?: (x: number, y: number) => void;
  onDeselectCard?: () => void;
  drawingLines?: DrawingLine[];
  onCreateLine?: (points: Point[], color: string) => void;
}

export function DrawingCanvas({ 
  isDrawingMode, 
  scale, 
  panX, 
  panY, 
  onPanChange, 
  onScaleChange,
  userColor = '#4a9ebb',
  onCreateCard,
  onDeselectCard,
  drawingLines = [],
  onCreateLine
}: DrawingCanvasProps) {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null); // Канвас для рисования (под заметками)
  const eventCanvasRef = useRef<HTMLCanvasElement>(null);   // Канвас для событий (поверх заметок)
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]); // Для текущей линии



  // Функция для рисования плавной линии через несколько точек
  const drawSmoothLine = useCallback((ctx: CanvasRenderingContext2D, points: Point[], color: string) => {
    if (points.length < 2) return;
    
    // Устанавливаем цвет линии
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    // Преобразуем мировые координаты в экранные для рисования
    const screenPoints = points.map(point => ({
      x: point.x * scale + panX,
      y: point.y * scale + panY
    }));
    
    ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    
    for (let i = 1; i < screenPoints.length - 2; i++) {
      const xc = (screenPoints[i].x + screenPoints[i + 1].x) / 2;
      const yc = (screenPoints[i].y + screenPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(screenPoints[i].x, screenPoints[i].y, xc, yc);
    }
    
    // Последний сегмент
    if (screenPoints.length > 2) {
      const lastIdx = screenPoints.length - 1;
      ctx.quadraticCurveTo(
        screenPoints[lastIdx - 1].x, 
        screenPoints[lastIdx - 1].y, 
        screenPoints[lastIdx].x, 
        screenPoints[lastIdx].y
      );
    }
    
    ctx.stroke();
  }, [scale, panX, panY]);

  // Функция для перерисовки всех линий
  const redrawAllLines = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Устанавливаем общие настройки рисования
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    
    // Рисуем все линии из пропсов (realtime)
    drawingLines.forEach(line => {
      drawSmoothLine(ctx, line.points, line.color);
    });
    
    // Рисуем текущую линию, если она есть
    if (points.length > 0) {
      const currentColor = getMutedColor(userColor);
      drawSmoothLine(ctx, points, currentColor);
    }
  }, [drawingLines, points, drawSmoothLine, userColor]);

  // Инициализация канвасов
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current;
    const eventCanvas = eventCanvasRef.current;
    if (!drawingCanvas || !eventCanvas) return;

    const drawingCtx = drawingCanvas.getContext('2d');
    if (!drawingCtx) return;

    // Устанавливаем размеры канвасов
    const resizeCanvases = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Рисовальный канвас
      drawingCanvas.width = width;
      drawingCanvas.height = height;
      
      // Событийный канвас
      eventCanvas.width = width;
      eventCanvas.height = height;
      
      // Настройки для рисования
      drawingCtx.lineCap = 'round';
      drawingCtx.lineJoin = 'round';
      drawingCtx.lineWidth = 3;
      drawingCtx.strokeStyle = getMutedColor(userColor); // Тухлый цвет участника
      drawingCtx.globalCompositeOperation = 'source-over';
      
      // Включаем anti-aliasing для плавных линий
      drawingCtx.imageSmoothingEnabled = true;
      drawingCtx.imageSmoothingQuality = 'high';
      
      // Дополнительные настройки для плавности
      drawingCtx.globalAlpha = 0.9; // Слегка прозрачные линии для мягкости
      
      // Canvases initialized
    };

    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    return () => window.removeEventListener('resize', resizeCanvases);
  }, [userColor]);

  // Получение координат канваса (мировые координаты с учетом трансформаций)
  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = eventCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // Преобразуем экранные координаты в мировые координаты
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    // Учитываем трансформации канваса
    const worldX = (screenX - panX) / scale;
    const worldY = (screenY - panY) / scale;
    
    return { x: worldX, y: worldY };
  }, [panX, panY, scale]);

  // Начало рисования
  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode) {
      return;
    }

    const drawingCanvas = drawingCanvasRef.current;
    const ctx = drawingCanvas?.getContext('2d');
    if (!drawingCanvas || !ctx) {
      return;
    }

    // Убеждаемся что цвет установлен правильно
    const mutedColor = getMutedColor(userColor);
    ctx.strokeStyle = mutedColor;

    setIsDrawing(true);
    const point = getCanvasPoint(e.clientX, e.clientY);
    setPoints([point]); // Начинаем новый массив точек
  }, [isDrawingMode, getCanvasPoint, userColor, getMutedColor]);

  // Рисование с плавными линиями
  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isDrawingMode) return;

    const drawingCanvas = drawingCanvasRef.current;
    const ctx = drawingCanvas?.getContext('2d');
    if (!drawingCanvas || !ctx) return;

    const currentPoint = getCanvasPoint(e.clientX, e.clientY);
    
    // Добавляем точку к массиву текущей линии
    setPoints(prevPoints => {
      const newPoints = [...prevPoints, currentPoint];
      
      // Перерисовываем все линии включая текущую
      redrawAllLines(ctx, drawingCanvas);
      
      return newPoints;
    });
  }, [isDrawing, isDrawingMode, getCanvasPoint, redrawAllLines]);

  // Завершение рисования
  const stopDrawing = useCallback(() => {
    if (!isDrawing || points.length === 0) return;
    
    // Сохраняем завершенную линию через realtime
    const currentColor = getMutedColor(userColor);
    if (onCreateLine) {
      onCreateLine([...points], currentColor);
      // Не очищаем точки - оставляем линию видимой до получения обновления через realtime
      // setPoints([]) будет вызван только когда придут обновленные данные из БД
    } else {
      setPoints([]);
    }
    
    setIsDrawing(false);
  }, [isDrawing, points, userColor, onCreateLine]);

  // Панорамирование
  const startPanning = useCallback((e: React.MouseEvent) => {
    if (isDrawingMode) return;
    
    // Сохраняем начальную позицию для определения порога движения
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [isDrawingMode, panX, panY]);

  const pan = useCallback((e: React.MouseEvent) => {
    if (!panStart || isDrawingMode) return;
    
    // Начинаем панорамирование при любом движении
    if (!isPanning) {
      setIsPanning(true);
    }
    
    const newPanX = e.clientX - panStart.x;
    const newPanY = e.clientY - panStart.y;
    onPanChange(newPanX, newPanY);
  }, [isPanning, panStart, isDrawingMode, onPanChange]);

  const stopPanning = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // Обработка колеса мыши для масштабирования
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const canvas = eventCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    
    // Масштабирование относительно позиции мыши
    const scaleDiff = newScale - scale;
    const newPanX = panX - (mouseX - panX) * (scaleDiff / scale);
    const newPanY = panY - (mouseY - panY) * (scaleDiff / scale);
    
    onScaleChange(newScale);
    onPanChange(newPanX, newPanY);
  }, [scale, panX, panY, onScaleChange, onPanChange]);

  useEffect(() => {
    const canvas = eventCanvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel);
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Перерисовка канваса при изменении линий из пропсов
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;
    
    // Если есть сохраненные линии и текущие точки, очищаем текущие точки
    // (это означает что наша линия была сохранена и пришла через realtime)
    if (drawingLines.length > 0 && points.length > 0 && !isDrawing) {
      setPoints([]);
    }
    
    redrawAllLines(ctx, drawingCanvas);
  }, [drawingLines, redrawAllLines, points.length, isDrawing]);

  // Тестовая функция рисования
  const testDraw = useCallback((e: React.MouseEvent) => {
    const drawingCanvas = drawingCanvasRef.current;
    const ctx = drawingCanvas?.getContext('2d');
    if (!drawingCanvas || !ctx) return;

    const rect = eventCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Перерисовываем все + добавляем тестовую точку
    redrawAllLines(ctx, drawingCanvas);
    
    ctx.fillStyle = getMutedColor(userColor);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }, [userColor, redrawAllLines]);

  // Обработчик двойного клика для создания карточки
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onCreateCard || isDrawingMode || isPanning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = eventCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Получаем координаты клика относительно канваса
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Преобразуем в координаты холста с учетом трансформаций
    const worldX = (canvasX - panX) / scale;
    const worldY = (canvasY - panY) / scale;
    
    onCreateCard(worldX, worldY);
  }, [onCreateCard, panX, panY, scale, isDrawingMode, isPanning]);

  return (
    <>
      {/* Канвас для рисования - под заметками */}
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 1, // Под заметками
        }}
      />
      
      {/* Канвас для событий - поверх заметок, но только в режиме рисования */}
      <canvas
        ref={eventCanvasRef}
        className={`absolute inset-0 w-full h-full ${
          isDrawingMode ? 'cursor-crosshair' : 'cursor-grab'
        } ${isPanning ? 'cursor-grabbing' : ''}`}
        style={{ 
          zIndex: isDrawingMode ? 10 : 3,
          backgroundColor: isDrawingMode ? 'var(--user-primary-lighter)' : 'transparent',
          pointerEvents: 'auto'
        }}
        onMouseDown={(e) => {
          if (isDrawingMode) {
            e.preventDefault();
            e.stopPropagation();
            startDrawing(e);
          } else {
            // Временно скрываем канвас чтобы проверить элемент под ним
            const canvas = e.currentTarget;
            canvas.style.pointerEvents = 'none';
            const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
            canvas.style.pointerEvents = 'auto';
            
            // Если клик на карточке, передаем события карточке
            const isOnCard = elementBelow?.closest('.idea-card') !== null;
            if (isOnCard) {
              // Передаем и click и mousedown событие
              const cardElement = elementBelow?.closest('.idea-card') as HTMLElement;
              if (cardElement) {
                // Сначала click для выделения
                cardElement.click();
                // Потом mousedown для перетаскивания
                cardElement.dispatchEvent(new MouseEvent('mousedown', {
                  bubbles: true,
                  cancelable: true,
                  clientX: e.clientX,
                  clientY: e.clientY,
                  button: e.button
                }));
              }
            } else {
              // Снимаем выделение с карточек при клике на пустое место
              onDeselectCard?.();
              startPanning(e);
            }
          }
        }}
        onMouseMove={(e) => {
          if (isDrawingMode) {
            draw(e);
          } else {
            pan(e);
          }
        }}
        onMouseUp={(e) => {
          if (isDrawingMode) {
            stopDrawing();
          } else {
            stopPanning();
          }
        }}
        onMouseLeave={(e) => {
          if (isDrawingMode) {
            stopDrawing();
          } else {
            stopPanning();
          }
        }}
        onClick={isDrawingMode ? testDraw : undefined}
        onDoubleClick={handleDoubleClick}
      />
    </>
  );
}
