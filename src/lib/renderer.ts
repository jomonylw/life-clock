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
    animation: AnimationInfo | null = null,
    overrideProgressValue?: number,
    overrideDenominator?: number
): string {
    let displayValue: number;
    let progressValue: number;
    let denominator: number;

    // Default assignments for percentage calculation
    progressValue = overrideProgressValue !== undefined ? overrideProgressValue : value;
    denominator = overrideDenominator !== undefined ? overrideDenominator : total;

    // Logic for display value
    const isOneBased = label === 'MONTH' || label === 'YEAR';

    if (isSecondBar) { // MINUTE bar (unit: SEC)
        if (perspective === 'ELAPSED') {
            displayValue = value === 0 ? 60 : value;
        } else { // REMAINING
            displayValue = total - value;
        }
    } else if (isOneBased) { // MONTH, YEAR bars
        const elapsedValue = value - 1;
        displayValue = perspective === 'ELAPSED' ? elapsedValue : total - elapsedValue;
    } else { // HOUR, DAY, LIFE bars
        displayValue = perspective === 'ELAPSED' ? value : total - value;
    }

    // Special handling for percentage calculation for specific bars
    if (isSecondBar) { // MINUTE
        denominator = total - 1;
        if (perspective === 'ELAPSED') {
            progressValue = value === 0 ? 59 : value - 1;
        }
    } else if (isOneBased) { // MONTH, YEAR
        if (overrideProgressValue === undefined) {
            progressValue = value - 1;
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
            const remainingPercentage = 1 - percentage;
            let filledPartLength;
            if (label === 'HOUR' && total === 60) {
                filledPartLength = total - value;
            } else {
                filledPartLength = Math.floor(remainingPercentage * (barCharacterWidth - 1e-9));
            }
            const emptyPartLength = barCharacterWidth - filledPartLength;

            for (let i = emptyPartLength; i < barCharacterWidth; i++) {
                barChars[i] = '▓';
            }
            if (label === 'HOUR' && total === 60) {
                // The head of the bar is the first character of the filled part.
                if (filledPartLength > 0 && emptyPartLength < barCharacterWidth) {
                    barChars[emptyPartLength] = '█';
                }
            } else {
                const isShrinkAnimation = animationActive && animation.type === 'shrink' && perspective === 'REMAINING';
                
                // To make the bar perfectly complementary, calculate position based on ELAPSED percentage.
                // The animation logic will handle the moving head, so we just render the final state here.
                const headPosForRender = Math.floor(percentage * (barCharacterWidth - 1e-9));
                const emptyPartLength = headPosForRender + 1;

                for (let i = emptyPartLength; i < barCharacterWidth; i++) {
                    barChars[i] = '▓';
                }
                // The head of the remaining bar starts right after the elapsed part ends.
                // Only draw the static head if not animating.
                if (!isShrinkAnimation && emptyPartLength < barCharacterWidth) {
                    barChars[emptyPartLength] = '█';
                }
            }
        } else { // ELAPSED
            let staticHeadPos = headPos;
            // During a grow animation, the static bar should remain in its previous state
            // to prevent the bar from looking like it's shortening before the animation starts.
            if (animationActive && animation.type === 'grow' && perspective === 'ELAPSED') {
                const prevProgressValue = progressValue > 0 ? progressValue - 1 : 0;
                const prevPercentage = prevProgressValue / denominator;
                staticHeadPos = Math.floor(prevPercentage * (barCharacterWidth - 1e-9));
            }

            if (label === 'HOUR' && total === 60) {
                if (animationActive && animation.type === 'grow' && perspective === 'ELAPSED') {
                    // For animation, the static part is the previous minute
                    staticHeadPos = value > 0 ? value - 1 : 0;
                } else {
                    // For static display, it's the current minute
                    staticHeadPos = value;
                }
            }

            for (let i = 0; i < staticHeadPos; i++) {
                barChars[i] = '▓';
            }
            // The head is drawn at its position. The animation logic will draw the moving head.
            if (label === 'HOUR' && total === 60) {
                if (staticHeadPos > 0) {
                    barChars[staticHeadPos - 1] = '█';
                }
            } else {
                if (percentage > 0 && staticHeadPos < barCharacterWidth) {
                    barChars[staticHeadPos] = '█';
                }
            }
        }

        if (animationActive) {
            if (animation.type === 'grow' && perspective === 'ELAPSED') {
                const animProgress = (animation.frame - 1) / (ANIMATION_FRAMES > 1 ? ANIMATION_FRAMES - 1 : 1);
                let finalHeadPos = headPos;
                if (label === 'HOUR' && total === 60) {
                    finalHeadPos = value;
                }
                const animationOffset = Math.round((barCharacterWidth - 1 - finalHeadPos) * (1 - animProgress));
                const animCharPos = finalHeadPos + animationOffset;

                // Draw the moving head. The default renderer has already drawn the
                // bar's body, and we've prevented it from drawing the static head.
                if (animCharPos >= 0 && animCharPos < barCharacterWidth) {
                    barChars[animCharPos] = '█';
                }
            } else if (animation.type === 'shrink' && perspective === 'REMAINING') {
                const animProgress = (animation.frame - 1) / (ANIMATION_FRAMES > 1 ? ANIMATION_FRAMES - 1 : 1);

                // The "shrink" animation for the remaining bar is a "fly out to the left" effect.
                // We need to calculate the head's position in the previous frame.
                const prevProgressValue = progressValue > 0 ? progressValue - 1 : 0;
                const prevElapsedPercentage = prevProgressValue / denominator;
                const prevHeadCharPos = Math.floor(prevElapsedPercentage * (barCharacterWidth - 1e-9));

                // The animation moves the head from its previous position to the left.
                const animationOffset = -Math.round((prevHeadCharPos + 1) * animProgress);
                const animCharPos = prevHeadCharPos + animationOffset;

                // The static render has already drawn the final state of the bar.
                // We need to erase the previous head and draw the animated one.
                if (prevHeadCharPos >= 0 && prevHeadCharPos < barCharacterWidth) {
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
    let displayPercentage = percentage;
    if (perspective === 'REMAINING') {
        // For display purposes, we want to show the remaining percentage.
        // The animation, however, needs the elapsed percentage to work correctly.
        displayPercentage = 1 - percentage;
    }
    // Special case for the seconds bar in REMAINING, which shows the countdown value directly.
    if (perspective === 'REMAINING' && isSecondBar) {
        displayPercentage = displayValue / total;
    }
    const percentStr = `${(displayPercentage * 100).toFixed(0).padStart(3, ' ')}%`;
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
        renderProgressBar('HOUR', 'MIN', now.getMinutes(), 60, barWidth, false, perspective, false, animationState['HOUR'], derived.secondsInHour, derived.totalSecondsInHour),
        renderProgressBar('DAY', 'HRS', now.getHours(), 24, barWidth, false, perspective, false, animationState['DAY'], derived.minutesInDay, derived.totalMinutesInDay),
    ];

    const dateBars = [
        renderProgressBar('MONTH', 'DAY', now.getDate(), daysInMonth, barWidth, false, perspective, false, animationState['MONTH'], derived.hoursInMonth, derived.totalHoursInMonth),
        renderProgressBar('YEAR', 'MTH', now.getMonth() + 1, 12, barWidth, false, perspective, false, animationState['YEAR'], derived.dayOfYear, derived.totalDaysInYear),
        renderProgressBar('LIFE', 'YRS', elapsed.years ?? 0, lifeExpectancy, barWidth, false, perspective, false, animationState['LIFE'], derived.totalElapsedMonths, derived.lifeExpectancyInMonths),
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