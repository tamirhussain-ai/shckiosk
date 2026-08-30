import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { X } from "lucide-react";

export interface SignaturePadRef {
  isEmpty: () => boolean;
  clear: () => void;
  getDataUrl: () => string;
}

export const SignaturePad = forwardRef<SignaturePadRef, { onBegin?: () => void; ariaLabel?: string }>(
  ({ onBegin, ariaLabel = "Signature pad" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const isDrawingRef = useRef(false);
    
    // Store paths as normalized coordinates (0..1)
    const pathsRef = useRef<{ x: number; y: number }[][]>([]);
    const currentPathRef = useRef<{ x: number; y: number }[]>([]);

    const drawPaths = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(dpr, dpr);
      
      const logicalWidth = width / dpr;
      const logicalHeight = height / dpr;

      ctx.strokeStyle = "#3d2626";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const drawPath = (path: { x: number; y: number }[]) => {
        if (path.length === 0) return;
        const firstX = path[0].x * logicalWidth;
        const firstY = path[0].y * logicalHeight;
        if (path.length === 1) {
          ctx.fillStyle = "#3d2626";
          ctx.beginPath();
          ctx.arc(firstX, firstY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * logicalWidth, path[i].y * logicalHeight);
        }
        ctx.stroke();
      };

      pathsRef.current.forEach(drawPath);
      if (currentPathRef.current.length > 0) {
        drawPath(currentPathRef.current);
      }

      ctx.restore();
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          drawPaths();
        }
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, [drawPaths]);

    useImperativeHandle(ref, () => ({
      isEmpty: () => isEmpty,
      clear: () => {
        pathsRef.current = [];
        currentPathRef.current = [];
        setIsEmpty(true);
        drawPaths();
      },
      getDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL("image/png");
      }
    }));

    const getNormalizedCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.setPointerCapture(e.pointerId);
      }

      isDrawingRef.current = true;
      currentPathRef.current = [getNormalizedCoordinates(e)];
      
      if (isEmpty) {
        setIsEmpty(false);
        onBegin?.();
      }
      drawPaths();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      currentPathRef.current.push(getNormalizedCoordinates(e));
      drawPaths();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      pathsRef.current.push([...currentPathRef.current]);
      currentPathRef.current = [];
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
      drawPaths();
    };

    return (
      <div className="relative w-full h-48 sm:h-56 bg-white border-2 border-[#e2d2bf] rounded-2xl overflow-hidden shadow-inner" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block w-full h-full touch-none cursor-crosshair"
          aria-label={ariaLabel}
          data-testid="signature-canvas"
          role="img"
          tabIndex={0}
        />
        {!isEmpty && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              pathsRef.current = [];
              currentPathRef.current = [];
              setIsEmpty(true);
              drawPaths();
            }}
            data-testid="signature-clear"
            className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-[#fff0ec] text-[#990000] text-xs font-bold px-2 py-1.5 rounded-lg border border-[#e8b9ad] shadow-sm transition-colors hover:bg-[#ffe1d9] focus:outline-none focus:ring-2 focus:ring-[#990000]"
          >
            <X size={14} /> Clear
          </button>
        )}
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-[#a5918a] text-sm font-semibold">Sign here</span>
          </div>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
