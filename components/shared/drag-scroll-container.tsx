"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function DragScrollContainer({
  children,
  className,
  showHint = false,
  hintText = "按住表格可左右拖动",
}: {
  children: ReactNode;
  className?: string;
  showHint?: boolean;
  hintText?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const shouldIgnoreDrag = (target: HTMLElement | null) => {
    if (!target) return false;
    return Boolean(
      target.closest("[data-no-drag-scroll='true']") ||
        target.closest("[role='dialog']") ||
        target.closest("button,input,select,textarea,a,[contenteditable='true']"),
    );
  };

  const syncScrollableState = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    syncScrollableState();
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => syncScrollableState();
    const resizeObserver = new ResizeObserver(() => syncScrollableState());

    el.addEventListener("scroll", onScroll, { passive: true });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-auto overscroll-x-contain rounded-lg",
          "cursor-grab active:cursor-grabbing",
          isDragging && "cursor-grabbing select-none",
        )}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const target = event.target as HTMLElement;
          if (shouldIgnoreDrag(target)) {
            return;
          }
          const el = containerRef.current;
          if (!el) return;
          dragStateRef.current.pointerId = event.pointerId;
          dragStateRef.current.startX = event.clientX;
          dragStateRef.current.startScrollLeft = el.scrollLeft;
          dragStateRef.current.moved = false;
          setIsDragging(true);
          el.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const el = containerRef.current;
          if (!el) return;
          const state = dragStateRef.current;
          if (!isDragging || state.pointerId !== event.pointerId) return;
          const deltaX = event.clientX - state.startX;
          if (Math.abs(deltaX) > 4) {
            state.moved = true;
          }
          el.scrollLeft = state.startScrollLeft - deltaX;
        }}
        onPointerUp={(event) => {
          const el = containerRef.current;
          if (!el) return;
          const state = dragStateRef.current;
          if (state.pointerId !== event.pointerId) return;
          setIsDragging(false);
          if (el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId);
          }
          state.pointerId = -1;
          window.setTimeout(() => {
            state.moved = false;
          }, 0);
        }}
        onPointerCancel={(event) => {
          const el = containerRef.current;
          if (!el) return;
          const state = dragStateRef.current;
          if (state.pointerId !== event.pointerId) return;
          setIsDragging(false);
          if (el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId);
          }
          state.pointerId = -1;
          state.moved = false;
        }}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;
          if (shouldIgnoreDrag(target)) return;
          if (!dragStateRef.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </div>

      {canScrollLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
      ) : null}
      {canScrollRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
      ) : null}
      {showHint && canScrollRight ? (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          {hintText}
        </div>
      ) : null}
    </div>
  );
}
