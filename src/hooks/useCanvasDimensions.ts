import { useState, useEffect, useRef } from 'react';

export const useCanvasDimensions = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({
        // Safe initial dimensions; will be immediately updated by ResizeObserver
        width: 1920,
        height: 1080 - 48,
    });
    const lastRef = useRef<{ width: number; height: number }>({ width: 1920, height: 1080 - 48 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const applyDims = (w: number, h: number) => {
            if (w > 0 && h > 0 && (w !== lastRef.current.width || h !== lastRef.current.height)) {
                lastRef.current = { width: w, height: h };
                setDimensions({ width: w, height: h });
            }
        };

        const updateFromRect = (rect: DOMRectReadOnly | DOMRect) => {
            const nextWidth = Math.ceil(rect.width);
            const nextHeight = Math.ceil(rect.height);
            applyDims(nextWidth, nextHeight);
        };

        // Initial measure
        updateFromRect(el.getBoundingClientRect());

        // Observe size changes precisely
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const rect = entry.contentRect || (entry.target as Element).getBoundingClientRect();
                updateFromRect(rect);
            }
        });
        ro.observe(el);

        const onWindowResize = () => updateFromRect(el.getBoundingClientRect());
        window.addEventListener('resize', onWindowResize);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', onWindowResize);
        };
    }, []);

    return { dimensions, containerRef };
};
