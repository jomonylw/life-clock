"use client";

import { useLifeMonitorState } from "@/hooks/useLifeMonitorState";
import { useTimeState } from "@/hooks/useTimeState";
import { render } from "@/lib/renderer";
import { useMemo, useEffect, useRef } from "react";
import { getOverlayContent, FieldRect, ButtonRect } from "@/lib/overlay";
import { useTheme } from "@/contexts/ThemeContext";
import clsx from "clsx";

export default function LifeClock() {
  const SCREEN_WIDTH = 89;
  const SCREEN_HEIGHT = 27;
  const OVERLAY_WIDTH = 60;
  const OVERLAY_HEIGHT = 10;
  const overlayX = Math.floor((SCREEN_WIDTH - OVERLAY_WIDTH) / 2);
  const overlayY = Math.floor((SCREEN_HEIGHT - OVERLAY_HEIGHT) / 2);

  const { state, actions } = useLifeMonitorState();
  const timeState = useTimeState(state.birthDate, state.perspective);
  const { toggleTheme } = useTheme();
  const overlayFields = useRef<FieldRect[]>([]);
  const confirmButtonRectRef = useRef<ButtonRect | null>(null);
  const cancelButtonRectRef = useRef<ButtonRect | null>(null);
  const adjustUpButtonRectRef = useRef<ButtonRect | null>(null);
  const adjustDownButtonRectRef = useRef<ButtonRect | null>(null);
  const editButtonRectRef = useRef<ButtonRect | null>(null);
  const switchButtonRectRef = useRef<ButtonRect | null>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const charSizeRef = useRef({ width: 0, height: 0 });
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const adjustUpButtonRef = useRef<HTMLButtonElement>(null);
  const adjustDownButtonRef = useRef<HTMLButtonElement>(null);

  const handlePressStart = (amount: number) => {
    actions.adjustValue(amount); // Immediate feedback

    pressTimeoutRef.current = setTimeout(() => {
      pressIntervalRef.current = setInterval(() => {
        actions.adjustValue(amount);
      }, 100); // Adjust speed here
    }, 400); // Delay before rapid adjust
  };

  const handlePressEnd = () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    if (pressIntervalRef.current) {
      clearInterval(pressIntervalRef.current);
      pressIntervalRef.current = null;
    }
  };

  const screenBuffer = useMemo(() => {
    let overlayBuffer: string[] | undefined = undefined;
    if (state.isEditing) {
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
      adjustUpButtonRectRef.current = overlay.adjustUpButtonRect;
      adjustDownButtonRectRef.current = overlay.adjustDownButtonRect;
    } else {
      overlayFields.current = [];
      confirmButtonRectRef.current = null;
      cancelButtonRectRef.current = null;
      adjustUpButtonRectRef.current = null;
      adjustDownButtonRectRef.current = null;
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

  useEffect(() => {
    const upButton = adjustUpButtonRef.current;
    const downButton = adjustDownButtonRef.current;

    const handleTouchStart = (e: TouchEvent, amount: number) => {
      e.preventDefault();
      handlePressStart(amount);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handlePressEnd();
    };

    const upTouchStart = (e: TouchEvent) => handleTouchStart(e, 1);
    const downTouchStart = (e: TouchEvent) => handleTouchStart(e, -1);

    if (upButton) {
      upButton.addEventListener('touchstart', upTouchStart, { passive: false });
      upButton.addEventListener('touchend', handleTouchEnd, { passive: false });
      upButton.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
    if (downButton) {
      downButton.addEventListener('touchstart', downTouchStart, { passive: false });
      downButton.addEventListener('touchend', handleTouchEnd, { passive: false });
      downButton.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    return () => {
      if (upButton) {
        upButton.removeEventListener('touchstart', upTouchStart);
        upButton.removeEventListener('touchend', handleTouchEnd);
        upButton.removeEventListener('touchcancel', handleTouchEnd);
      }
      if (downButton) {
        downButton.removeEventListener('touchstart', downTouchStart);
        downButton.removeEventListener('touchend', handleTouchEnd);
        downButton.removeEventListener('touchcancel', handleTouchEnd);
      }
    };
  }, [state.isEditing]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center font-mono">
      <pre ref={preRef} onClick={handleCanvasClick} style={{ cursor: state.isEditing ? 'pointer' : 'default' }} className="relative">
        {screenBuffer.join("\n")}
        {state.isEditing && confirmButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={actions.handleConfirm}
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-yellow-500/50'
            )}
            style={{
              top: `${(confirmButtonRectRef.current.y * charSizeRef.current.height) - 16}px`,
              left: `${confirmButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${confirmButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${confirmButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {state.isEditing && cancelButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={actions.handleCancel}
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-red-500/50'
            )}
            style={{
              top: `${(cancelButtonRectRef.current.y * charSizeRef.current.height) - 16}px`,
              left: `${cancelButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${cancelButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${cancelButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {!state.isEditing && editButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            onClick={() => actions.setIsEditing(true)}
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-blue-500/50'
            )}
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
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-green-500/50'
            )}
            style={{
              top: `${(switchButtonRectRef.current.y * charSizeRef.current.height)}px`,
              left: `${switchButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${switchButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${switchButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {state.isEditing && adjustUpButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            ref={adjustUpButtonRef}
            onMouseDown={() => handlePressStart(1)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-purple-500/50'
            )}
            style={{
              top: `${(adjustUpButtonRectRef.current.y * charSizeRef.current.height)}px`,
              left: `${adjustUpButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${adjustUpButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${adjustUpButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {state.isEditing && adjustDownButtonRectRef.current && charSizeRef.current.width > 0 && (
          <button
            ref={adjustDownButtonRef}
            onMouseDown={() => handlePressStart(-1)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            className={clsx(
              "absolute focus:outline-none hover:bg-white/10 transition-colors rounded-sm",
              process.env.NODE_ENV === 'development' && 'bg-purple-500/50'
            )}
            style={{
              top: `${(adjustDownButtonRectRef.current.y * charSizeRef.current.height)}px`,
              left: `${adjustDownButtonRectRef.current.x * charSizeRef.current.width}px`,
              width: `${adjustDownButtonRectRef.current.width * charSizeRef.current.width}px`,
              height: `${adjustDownButtonRectRef.current.height * charSizeRef.current.height}px`,
            }}
          />
        )}
        {state.isEditing &&
          overlayFields.current.map((field) => (
            <div
              key={field.name}
              className={clsx(
                "absolute",
                process.env.NODE_ENV === "development" &&
                  "bg-cyan-500/20"
              )}
              style={{
                top: `${field.y * charSizeRef.current.height}px`,
                left: `${field.x * charSizeRef.current.width}px`,
                width: `${field.width * charSizeRef.current.width}px`,
                height: `${field.height * charSizeRef.current.height}px`,
              }}
            />
          ))}
        {process.env.NODE_ENV === 'development' && state.isEditing && (
        <>
          {/* Top */}
          <div
            className="absolute bg-blue-500/50 pointer-events-none"
            style={{
              top: 0,
              left: 0,
              width: `${SCREEN_WIDTH * charSizeRef.current.width}px`,
              height: `${overlayY * charSizeRef.current.height}px`,
            }}
          />
          {/* Bottom */}
          <div
            className="absolute bg-blue-500/50 pointer-events-none"
            style={{
              top: `${(overlayY + OVERLAY_HEIGHT) * charSizeRef.current.height}px`,
              left: 0,
              width: `${SCREEN_WIDTH * charSizeRef.current.width}px`,
              height: `${(SCREEN_HEIGHT - (overlayY + OVERLAY_HEIGHT)) * charSizeRef.current.height}px`,
            }}
          />
          {/* Left */}
          <div
            className="absolute bg-blue-500/50 pointer-events-none"
            style={{
              top: `${overlayY * charSizeRef.current.height}px`,
              left: 0,
              width: `${overlayX * charSizeRef.current.width}px`,
              height: `${OVERLAY_HEIGHT * charSizeRef.current.height}px`,
            }}
          />
          {/* Right */}
          <div
            className="absolute bg-blue-500/50 pointer-events-none"
            style={{
              top: `${overlayY * charSizeRef.current.height}px`,
              left: `${(overlayX + OVERLAY_WIDTH) * charSizeRef.current.width}px`,
              width: `${(SCREEN_WIDTH - (overlayX + OVERLAY_WIDTH)) * charSizeRef.current.width}px`,
              height: `${OVERLAY_HEIGHT * charSizeRef.current.height}px`,
            }}
          />
        </>
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