import {
  addYears,
  differenceInSeconds,
  intervalToDuration,
  type Duration,
  getDayOfYear,
  getDaysInYear,
  getDaysInMonth,
} from "date-fns";
import type { LifeMonitorState } from "@/hooks/useLifeMonitorState";

export interface DerivedData {
  eolDate: Date | null;
  elapsed: Duration;
  remaining: Duration;
  lifeDurationInSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  // YEAR
  dayOfYear: number;
  totalDaysInYear: number;
  // LIFE
  totalElapsedMonths: number;
  lifeExpectancyInMonths: number;
  // HOUR
  secondsInHour: number;
  totalSecondsInHour: number;
  // DAY
  minutesInDay: number;
  totalMinutesInDay: number;
  // MONTH
  hoursInMonth: number;
  totalHoursInMonth: number;
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
      dayOfYear: 0,
      totalDaysInYear: 0,
      totalElapsedMonths: 0,
      lifeExpectancyInMonths: 0,
      secondsInHour: 0,
      totalSecondsInHour: 3600,
      minutesInDay: 0,
      totalMinutesInDay: 1440,
      hoursInMonth: 0,
      totalHoursInMonth: 0,
    };
  }

  const eolDate = addYears(birthDate, lifeExpectancy);
  const lifeDurationInSeconds = differenceInSeconds(eolDate, birthDate);
  const elapsedSeconds = differenceInSeconds(now, birthDate);
  const remainingSeconds = differenceInSeconds(eolDate, now);

  const elapsed = intervalToDuration({ start: birthDate, end: now });
  const remaining = intervalToDuration({ start: now, end: eolDate });

  // YEAR
  const dayOfYear = getDayOfYear(now);
  const totalDaysInYear = getDaysInYear(now);
  // LIFE
  const totalElapsedMonths = (elapsed.years ?? 0) * 12 + (elapsed.months ?? 0);
  const lifeExpectancyInMonths = lifeExpectancy * 12;
  // HOUR
  const secondsInHour = now.getMinutes() * 60 + now.getSeconds();
  // DAY
  const minutesInDay = now.getHours() * 60 + now.getMinutes();
  // MONTH
  const daysInMonth = getDaysInMonth(now);
  const hoursInMonth = (now.getDate() - 1) * 24 + now.getHours();
  const totalHoursInMonth = daysInMonth * 24;


  return {
    eolDate,
    elapsed,
    remaining,
    lifeDurationInSeconds,
    elapsedSeconds,
    remainingSeconds,
    dayOfYear,
    totalDaysInYear,
    totalElapsedMonths,
    lifeExpectancyInMonths,
    secondsInHour,
    totalSecondsInHour: 3600,
    minutesInDay,
    totalMinutesInDay: 1440,
    hoursInMonth,
    totalHoursInMonth,
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