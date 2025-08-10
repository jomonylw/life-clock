import type { LifeMonitorState } from "@/hooks/useLifeMonitorState";
import type { TimeState, AnimationInfo } from "@/hooks/useTimeState";
import { getAsciiClockStringArray } from "@/components/AsciiClock";
import { calculateDerivedData, formatDuration } from "./time";

const WIDTH = 89;
const HEIGHT = 27;
const ANIMATION_FRAMES = 5; // 5 frames * 100ms interval = 500ms animation

function writeToBuffer(buffer: string[], y: number, x: number, content: string) {
    if (y >= 0 && y < buffer.length) {
        const line = buffer[y];
        buffer[y] = line.substring(0, x) + content + line.substring(x + content.length);
    }
}

function drawHeader(buffer: string[], state: LifeMonitorState, timeState: TimeState) {
    const { birthDate, lifeExpectancy, perspective } = state;
    if (!birthDate || !lifeExpectancy) return;

    const derived = calculateDerivedData(state, timeState.now);
    if (!derived.eolDate) return;

    const milliseconds = timeState.now.getMilliseconds();
    let anchor = '';
    let metric = '';

    if (perspective === 'ELAPSED') {
        anchor = `BORN ${birthDate.toISOString().slice(0, 10).replace(/-/g, '/')}`;
        metric = `ELAPSED: ${formatDuration(derived.elapsed, true, milliseconds)}`;
    } else {
        anchor = `EOL ${derived.eolDate.toISOString().slice(0, 10).replace(/-/g, '/')}`;
        metric = `REMAINING: ${formatDuration(derived.remaining, true, 999 - milliseconds)}`;
    }
    
    const leftPart = `LIFE CLOCK :: ${anchor}  `;
    const rightPart = metric;
    const totalWidth = WIDTH - 4;
    const padding = totalWidth - leftPart.length - rightPart.length;
    const headerText = `${leftPart}${' '.repeat(padding > 0 ? padding : 0)}${rightPart}`;
    writeToBuffer(buffer, 1, 2, headerText);
}

function drawDateAndClock(buffer: string[], timeState: TimeState) {
    const now = timeState.now;
    const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][now.getDay()];
    const dateStr = `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${String(now.getDate()).padStart(2, '0')} | ${dayOfWeek}`;
    
    const dateX = Math.floor((WIDTH - dateStr.length) / 2);
    writeToBuffer(buffer, 4, dateX, dateStr);

    const asciiClockLines = getAsciiClockStringArray(now);
    const clockX = Math.floor((WIDTH - asciiClockLines[0].length) / 2);
    asciiClockLines.forEach((line, i) => {
        writeToBuffer(buffer, 6 + i, clockX, line);
    });
}

function renderProgressBar(
    label: string,
    unit: string,
    value: number,
    total: number,
    barCharacterWidth: number,
    isSecondBar: boolean = false,
    perspective: 'ELAPSED' | 'REMAINING' = 'ELAPSED',
    flash: boolean = false,
    animation: AnimationInfo | null = null
): string {
    let displayValue: number;
    let progressValue: number; // This will be the numerator for percentage.
    let denominator: number; // This will be the denominator for percentage.

    const isOneBased = label === 'DAY' || label === 'MONTH';

    if (perspective === 'ELAPSED') {
        denominator = isSecondBar ? total - 1 : total;
        if (isSecondBar) {
            const effectiveValue = value === 0 ? total : value; // Map 0s to 60s
            displayValue = effectiveValue;
            progressValue = effectiveValue - 1; // Map 1-60 to 0-59
        } else if (isOneBased) {
            displayValue = value;
            progressValue = value - 1; // Map 1-N to 0-N-1
        } else { // 0-based
            displayValue = value;
            progressValue = value; // Map 0-N-1 to 0-N-1
        }
    } else { // REMAINING
        denominator = isSecondBar ? total - 1 : total;
        if (isSecondBar) {
            // 60s rem (val=0) -> display=60, progress=0 (start of bar)
            // 1s rem (val=59) -> display=1, progress=59 (end of bar)
            displayValue = total - value;
            progressValue = value;
        } else if (isOneBased) {
            // 31d rem (val=1) -> display=31, progress=total-value (full bar)
            // 1d rem (val=31) -> display=1, progress=0 (empty bar)
            displayValue = total - (value - 1);
            progressValue = total - value;
        } else { // 0-based
            // 60m rem (val=0) -> display=60, progress=total (full bar)
            // 1m rem (val=59) -> display=1, progress=1 (almost empty bar)
            displayValue = total - value;
            progressValue = total - value;
        }
    }

    const percentage = denominator > 0 ? progressValue / denominator : 0;

    // 1. Label Part: right-align the label in a block of 7 chars
    // 1. Label Part: Adjust padding based on the length of the total value.
    const totalStr = String(total);
    const valStr = String(displayValue).padStart(2, '0');

    const LABEL_AREA_WIDTH = 18;

    const textPart = `${label.toUpperCase()}[${valStr}/${totalStr}] ${unit.toUpperCase()}`;
    const labelPart = textPart.padStart(LABEL_AREA_WIDTH, ' ');

    // 2. Bar Part
    let barContent = '';
    const headPos = Math.floor(percentage * (barCharacterWidth - 1e-9));

    if (isSecondBar) {
        const headChar = flash ? '▓' : '█';
        let bar = "=".repeat(barCharacterWidth);
        if (perspective === 'REMAINING') {
            const invertedHeadPos = barCharacterWidth - 1 - headPos;
            bar = bar.substring(0, invertedHeadPos) + headChar + bar.substring(invertedHeadPos + 1);
            barContent = `${bar.slice(0, -1)}<`;
        } else { // ELAPSED
            bar = bar.substring(0, headPos) + headChar + bar.substring(headPos + 1);
            barContent = `>${bar.slice(1)}`;
        }
    } else {
        const barChars = Array(barCharacterWidth).fill('░');
        const animationActive = animation && animation.frame > 0;

        // Default bar rendering
        if (perspective === 'REMAINING') {
            const filledPartLength = headPos;
            const emptyPartLength = barCharacterWidth - filledPartLength;
            for (let i = emptyPartLength; i < barCharacterWidth; i++) {
                barChars[i] = '▓';
            }
            if (emptyPartLength - 1 >= 0) {
                barChars[emptyPartLength - 1] = '█';
            }
        } else { // ELAPSED
            for (let i = 0; i < headPos; i++) {
                barChars[i] = '▓';
            }
            if (headPos < barCharacterWidth) {
                barChars[headPos] = '█';
            }
        }

        if (animationActive) {
            if (animation.type === 'grow' && perspective === 'ELAPSED') {
                const animProgress = animation.frame / ANIMATION_FRAMES;
                const animationOffset = Math.round((barCharacterWidth - 1 - headPos) * (1 - animProgress));
                const animCharPos = headPos + animationOffset;
                
                if (headPos >= 0 && headPos < barCharacterWidth) barChars[headPos] = '▓';
                if (animCharPos >= 0 && animCharPos < barCharacterWidth) {
                    barChars[animCharPos] = '█';
                }
            } else if (animation.type === 'shrink' && perspective === 'REMAINING') {
                const animProgress = animation.frame / ANIMATION_FRAMES;
                const prevProgressValue = progressValue + 1;
                const prevFilledLength = Math.floor((prevProgressValue / denominator) * (barCharacterWidth - 1e-9));
                const prevHeadCharPos = barCharacterWidth - prevFilledLength - 1;

                const animationOffset = -Math.round(prevHeadCharPos * animProgress);
                const animCharPos = prevHeadCharPos + animationOffset;

                if (prevHeadCharPos >= 0) {
                    barChars[prevHeadCharPos] = '░';
                }
                if (animCharPos >= 0 && animCharPos < barCharacterWidth) {
                    barChars[animCharPos] = '█';
                }
            }
        }
        barContent = barChars.join('');
    }
    const finalBar = `|${barContent.slice(0, barCharacterWidth)}|`;

    // 3. Percentage Part
    const percentValue = (perspective === 'REMAINING' && isSecondBar)
        ? displayValue / total
        : percentage;
    const percentStr = `${(percentValue * 100).toFixed(0).padStart(3, ' ')}%`;
    const finalPercent = ` ${percentStr} `; // Total 6 chars

    // Assembly: 18 (label) + 1 (space) + 61 (bar) + 6 (percent) = 86 chars
    return `${labelPart} ${finalBar}${finalPercent}`;
}


function drawProgressBars(buffer: string[], state: LifeMonitorState, timeState: TimeState) {
    const { birthDate, lifeExpectancy, perspective } = state;
    const { now, animationState, flashState } = timeState;
    if (!birthDate || !lifeExpectancy) return;

    const derived = calculateDerivedData(state, now);
    const elapsed = derived.elapsed;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const barWidth = 60;

    const timeBars = [
        renderProgressBar('MINUTE', 'SEC', now.getSeconds(), 60, barWidth, true, perspective, flashState['MINUTE'], null),
        renderProgressBar('HOUR', 'MIN', now.getMinutes(), 60, barWidth, false, perspective, false, animationState['HOUR']),
        renderProgressBar('DAY', 'HRS', now.getHours(), 24, barWidth, false, perspective, false, animationState['DAY']),
    ];

    const dateBars = [
        renderProgressBar('MONTH', 'DAY', now.getDate(), daysInMonth, barWidth, false, perspective, false, animationState['MONTH']),
        renderProgressBar('YEAR', 'MTH', now.getMonth() + 1, 12, barWidth, false, perspective, false, animationState['YEAR']),
        renderProgressBar('LIFE', 'YRS', elapsed.years ?? 0, lifeExpectancy, barWidth, false, perspective, false, animationState['LIFE']),
    ];

    timeBars.forEach((line, i) => {
        writeToBuffer(buffer, 14 + i, 1, line);
    });

    dateBars.forEach((line, i) => {
        writeToBuffer(buffer, 20 + i, 1, line);
    });
}

function drawFooter(buffer: string[], state: LifeMonitorState) {
    const controls = "[E]dit | [S]witch";
    const perspectiveStr = `> PERSPECTIVE : [ ${state.perspective} ]`;
    const padding = WIDTH - 2 - 2 - controls.length - perspectiveStr.length;
    const footerText = `${controls}${" ".repeat(padding)}${perspectiveStr}`;
    writeToBuffer(buffer, 25, 2, footerText);
}

import { ButtonRect } from './overlay';

export function render(
    state: LifeMonitorState,
    timeState: TimeState,
    overlay?: string[]
): {
    buffer: string[],
    editButtonRect: ButtonRect,
    switchButtonRect: ButtonRect,
} {
    const buffer: string[] = Array(HEIGHT).fill('');
    buffer[0] = "┌" + "─".repeat(WIDTH - 2) + "┐";
    for (let i = 1; i < HEIGHT - 1; i++) {
        buffer[i] = "│" + " ".repeat(WIDTH - 2) + "│";
    }
    buffer[HEIGHT - 1] = "└" + "─".repeat(WIDTH - 2) + "┘";

    buffer[2] = "├" + "═".repeat(WIDTH - 2) + "┤";
    const todayLabel = "[ TODAY ]";
    const todayPaddingLeft = Math.floor((WIDTH - 2 - todayLabel.length) / 2);
    const todayPaddingRight = WIDTH - 2 - todayLabel.length - todayPaddingLeft;
    buffer[12] = "├" + "─".repeat(todayPaddingLeft) + todayLabel + "─".repeat(todayPaddingRight) + "┤";

    const lifeLabel = "[ LIFE ]";
    const lifePaddingLeft = Math.floor((WIDTH - 2 - lifeLabel.length) / 2);
    const lifePaddingRight = WIDTH - 2 - lifeLabel.length - lifePaddingLeft;
    buffer[18] = "├" + "─".repeat(lifePaddingLeft) + lifeLabel + "─".repeat(lifePaddingRight) + "┤";
    buffer[24] = "├" + "─".repeat(WIDTH - 2) + "┤";

    drawHeader(buffer, state, timeState);
    drawDateAndClock(buffer, timeState);
    drawProgressBars(buffer, state, timeState);
    drawFooter(buffer, state);

    if (overlay) {
        const overlayHeight = overlay.length;
        const overlayWidth = overlay[0]?.length || 0;
        const startY = Math.floor((HEIGHT - overlayHeight) / 2);
        const startX = Math.floor((WIDTH - overlayWidth) / 2);

        // Draw shadow
        const shadowChar = '░';
        overlay.forEach((line, i) => {
            const y = startY + i + 1;
            const x = startX + 1;
            const shadowLine = line.replace(/[^\s]/g, shadowChar);
            writeToBuffer(buffer, y, x, shadowLine);
        });

        // Draw overlay
        overlay.forEach((line, i) => {
            const y = startY + i;
            writeToBuffer(buffer, y, startX, line);
        });
    }

    const editButtonRect: ButtonRect = { name: 'edit', x: 2, y: 25, width: 6, height: 1 };
    const switchButtonRect: ButtonRect = { name: 'switch', x: 11, y: 25, width: 8, height: 1 };

    return {
        buffer,
        editButtonRect,
        switchButtonRect,
    };
}