"use client";

import { useState, useEffect } from 'react';
import type { Perspective } from './useLifeMonitorState';

export interface AnimationInfo {
  type: 'grow' | 'shrink';
  frame: number;
}

export interface TimeState {
  now: Date;
  animationState: Record<string, AnimationInfo | null>;
  flashState: Record<string, boolean>;
}

const ANIMATION_FRAMES = 5; // 5 frames * 100ms interval = 500ms animation

export const useTimeState = (birthDate: Date | null, perspective: Perspective) => {
  const [timeState, setTimeState] = useState<TimeState>({
    now: new Date(),
    animationState: {},
    flashState: {},
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(prevTimeState => {
        const now = new Date();
        const prevNow = prevTimeState.now;
        const newAnimationState: Record<string, AnimationInfo | null> = {};

        // 1. Advance or clear existing animations
        for (const key in prevTimeState.animationState) {
          const anim = prevTimeState.animationState[key];
          if (anim && anim.frame < ANIMATION_FRAMES) {
            newAnimationState[key] = { ...anim, frame: anim.frame + 1 };
          }
        }

        // 2. Trigger new animations
        const animationType = perspective === 'ELAPSED' ? 'grow' : 'shrink';
        const changes: Record<string, boolean> = {
          HOUR: now.getMinutes() !== prevNow.getMinutes(),
          DAY: now.getHours() !== prevNow.getHours(),
          MONTH: now.getDate() !== prevNow.getDate(),
          YEAR: now.getMonth() !== prevNow.getMonth(),
          LIFE: birthDate ? now.getFullYear() !== prevNow.getFullYear() : false,
        };

        for (const key in changes) {
          if (changes[key]) {
            newAnimationState[key] = { type: animationType, frame: 1 };
          }
        }
        
        // Special case for MINUTE bar, which just flashes, not animates.
        const flashState = {
            MINUTE: now.getSeconds() !== prevNow.getSeconds()
        };

        return { ...prevTimeState, now, animationState: newAnimationState, flashState };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [birthDate, perspective]); // Depend on birthDate and perspective

  return timeState;
};