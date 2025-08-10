import {
  addYears,
  differenceInSeconds,
  intervalToDuration,
  type Duration,
} from "date-fns";
import type { LifeMonitorState } from "@/hooks/useLifeMonitorState";

export interface DerivedData {
  eolDate: Date | null;
  elapsed: Duration;
  remaining: Duration;
  lifeDurationInSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
}

export function calculateDerivedData(
  state: LifeMonitorState,
  now: Date
): DerivedData {
  const { birthDate, lifeExpectancy } = state;

  if (!birthDate || !lifeExpectancy) {
    return {
      eolDate: null,
      elapsed: {},
      remaining: {},
      lifeDurationInSeconds: 0,
      elapsedSeconds: 0,
      remainingSeconds: 0,
    };
  }

  const eolDate = addYears(birthDate, lifeExpectancy);
  const lifeDurationInSeconds = differenceInSeconds(eolDate, birthDate);
  const elapsedSeconds = differenceInSeconds(now, birthDate);
  const remainingSeconds = differenceInSeconds(eolDate, now);

  const elapsed = intervalToDuration({ start: birthDate, end: now });
  const remaining = intervalToDuration({ start: now, end: eolDate });

  return {
    eolDate,
    elapsed,
    remaining,
    lifeDurationInSeconds,
    elapsedSeconds,
    remainingSeconds,
  };
}

export function formatDuration(duration: Duration, withTime: boolean = false, milliseconds: number = 0): string {
  const { years, months, days, hours, minutes, seconds } = duration;
  let str = `${years ?? 0}y ${months ?? 0}m ${days ?? 0}d`;
  if (withTime) {
    str += ` ${String(hours ?? 0).padStart(2, '0')}:${String(minutes ?? 0).padStart(2, '0')}:${String(seconds ?? 0).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
  return str;
}