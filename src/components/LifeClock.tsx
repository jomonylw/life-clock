"use client";

import { useLifeMonitorState } from "@/hooks/useLifeMonitorState";
import { useTimeState } from "@/hooks/useTimeState";
import { render } from "@/lib/renderer";
import { useMemo, useEffect, useRef } from "react";
import { getOverlayContent, FieldRect, ButtonRect } from "@/lib/overlay";
import { useTheme } from "@/contexts/ThemeContext";

export default function LifeClock() {
  const { state, actions } = useLifeMonitorState();
  const timeState = useTimeState(state.birthDate, state.perspective);
  const { toggleTheme } = useTheme();
  const overlayFields = useRef<FieldRect[]>([]);
  const confirmButtonRectRef = useRef<ButtonRect | null>(null);
  const cancelButtonRectRef = useRef<ButtonRect | null>(null);
  const editButtonRectRef = useRef<ButtonRect | null>(null);
  const switchButtonRectRef = useRef<ButtonRect | null>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const charSizeRef = useRef({ width: 0, height: 0 });

  const screenBuffer = useMemo(() => {
    let overlayBuffer: string[] | undefined = undefined;
    if (state.isEditing) {
      const SCREEN_WIDTH = 89;
      const SCREEN_HEIGHT = 27;
      const OVERLAY_WIDTH = 60;
      const OVERLAY_HEIGHT = 10;
      const overlayX = Math.floor((SCREEN_WIDTH - OVERLAY_WIDTH) / 2);
      const overlayY = Math.floor((SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2);

      const overlay = getOverlayContent({
        year: state.draftYear,
        month: state.draftMonth,
        day: state.draftDay,
        lifeExpectancy: state.draftLifeExpectancy,
        activeField: state.activeField,
        overlayX,
        overlayY,
      });
      overlayBuffer = overlay.buffer;
      overlayFields.current = overlay.fields;
      confirmButtonRectRef.current = overlay.confirmButtonRect;
      cancelButtonRectRef.current = overlay.cancelButtonRect;
    } else {
      overlayFields.current = [];
      confirmButtonRectRef.current = null;
      cancelButtonRectRef.current = null;
    }
    const renderResult = render(state, timeState, overlayBuffer);
    editButtonRectRef.current = renderResult.editButtonRect;
    switchButtonRectRef.current = renderResult.switchButtonRect;
    return renderResult.buffer;
  }, [state, timeState]);

  useEffect(() => {
    if (preRef.current) {
      const rect = preRef.current.getBoundingClientRect();
      const SCREEN_WIDTH = 89;
      const SCREEN_HEIGHT = 27;
      charSizeRef.current = {
        width: rect.width / SCREEN_WIDTH,
        height: rect.height / SCREEN_HEIGHT,
      };
    }
  }, [state.isEditing, screenBuffer]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLPreElement>) => {
    if (!charSizeRef.current.width || !charSizeRef.current.height) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / charSizeRef.current.width);
    const y = Math.floor((event.clientY - rect.top) / charSizeRef.current.height);

    if (state.isEditing) {
      const SCREEN_WIDTH = 89;
      const SCREEN_HEIGHT = 27;
      const OVERLAY_WIDTH = 60;
      const OVERLAY_HEIGHT = 10;
      const overlayX = Math.floor((SCREEN_WIDTH - OVERLAY_WIDTH) / 2);
      const overlayY = Math.floor((SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2);

      const isClickInsideOverlay =
        x >= overlayX &&
        x < overlayX + OVERLAY_WIDTH &&
        y >= overlayY &&
        y < overlayY + OVERLAY_HEIGHT;

      if (isClickInsideOverlay) {
        // Click is inside the overlay, only check for field activation
        for (const field of overlayFields.current) {
          if (x >= field.x && x < field.x + field.width && y >= field.y && y < field.y + field.height) {
            actions.setActiveField(field.name);
            break;
          }
        }
      } else {
        // Click is outside the overlay, close it
        actions.handleCancel();
      }
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global keydowns are ignored while editing, as the hook handles them
      if (state.isEditing) return;

      switch (event.key) {
        case 's':
        case ' ':
          actions.togglePerspective();
          break;
        case 'e':
          actions.setIsEditing(true);
          break;
        case 't':
          toggleTheme();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isEditing, actions, toggleTheme]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center font-mono">
      <pre ref={preRef} onClick={handleCanvasClick} style={{ cursor: state.isEditing ? 'pointer' : 'default' }} className="relative">
        {screenBuffer.join("\n")}
        {state.isEditing && confirmButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={actions.handleConfirm}
            className="absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm"
            style={{
              top: `${(confirmButtonRectRef.current.y * charSizeRef.current.height) - 12}px`,
              left: `${confirmButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${confirmButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${confirmButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {state.isEditing && cancelButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={actions.handleCancel}
            className="absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm"
            style={{
              top: `${(cancelButtonRectRef.current.y * charSizeRef.current.height) - 12}px`,
              left: `${cancelButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${cancelButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${cancelButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {!state.isEditing && editButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={() => actions.setIsEditing(true)}
            className="absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm"
            style={{
              top: `${(editButtonRectRef.current.y * charSizeRef.current.height)}px`,
              left: `${editButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${editButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${editButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {!state.isEditing && switchButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={() => actions.togglePerspective()}
            className="absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm"
            style={{
              top: `${(switchButtonRectRef.current.y * charSizeRef.current.height)}px`,
              left: `${switchButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${switchButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${switchButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
      </pre>
      <a
        href="https://github.com/jomonylw/life-clock"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4"
      >
        <pre className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
          [ GITHUB ]
        </pre>
      </a>
    </main>
  );
}