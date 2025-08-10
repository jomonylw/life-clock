import { EditableField } from "@/hooks/useLifeMonitorState";

export interface FieldRect {
    name: EditableField;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ButtonRect {
  name: 'confirm' | 'cancel' | 'edit' | 'switch';
  x: number;
  y: number;
  width: number;
    height: number;
}

interface GetOverlayContentParams {
    year: number;
    month: number;
    day: number;
    lifeExpectancy: number;
    activeField: EditableField;
    overlayX: number;
    overlayY: number;
}

export interface OverlayContent {
    buffer: string[];
    fields: FieldRect[];
    confirmButtonRect: ButtonRect;
    cancelButtonRect: ButtonRect;
}

export const getOverlayContent = (params: GetOverlayContentParams): OverlayContent => {
    const { year, month, day, lifeExpectancy, activeField } = params;
    const width = 60;
    const buffer: string[] = [];
    const fields: FieldRect[] = [];

    // Helper to create a line with borders, with centered text
    const centeredLine = (text: string): string => {
        const padding = width - 2 - text.length;
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return "│" + " ".repeat(leftPad) + text + " ".repeat(rightPad) + "│";
    };

    // Helper to create a line with borders, with left-aligned text
    const contentLine = (text: string): string => {
        return "│" + text.padEnd(width - 2) + "│";
    };

    // Prepare values
    const yearStr = year.toString().padStart(4, '0');
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const lifeExpectancyStr = lifeExpectancy.toString();

    const { overlayX, overlayY } = params;
    const yPos = 4;
    const birthDateLabel = " Birth Date (YYYY/MM/DD): ";
    const yearX = birthDateLabel.length + 1;
    const monthX = yearX + 5;
    const dayX = monthX + 3;

    fields.push({ name: 'year', x: overlayX + yearX, y: overlayY + yPos, width: 4, height: 1 });
    fields.push({ name: 'month', x: overlayX + monthX, y: overlayY + yPos, width: 2, height: 1 });
    fields.push({ name: 'day', x: overlayX + dayX, y: overlayY + yPos, width: 2, height: 1 });

    const birthDateText = `${birthDateLabel}${
        activeField === 'year' ? `[${yearStr}]` : `${yearStr}`
    }/${
        activeField === 'month' ? `[${monthStr}]` : `${monthStr}`
    }/${
        activeField === 'day' ? `[${dayStr}]` : `${dayStr}`
    }`;

    const lifeExpectancyLabel = " Life Expectancy (Years): ";
    const lifeExpectancyX = lifeExpectancyLabel.length + 1;
    const lifeExpectancyY = yPos + 2;
    fields.push({ name: 'lifeExpectancy', x: overlayX + lifeExpectancyX, y: overlayY + lifeExpectancyY, width: lifeExpectancyStr.length + 2, height: 1 });

    const lifeExpectancyText = `${lifeExpectancyLabel}${
        activeField === 'lifeExpectancy' ? `[${lifeExpectancyStr}]` : ` ${lifeExpectancyStr} `
    }`;
    
    const instructionsText = "[Arrows] Move/Adjust";
    const confirmText = "[Enter] Confirm";
    const cancelText = "[E]sc Cancel";
    const instructionsLine = `${instructionsText}  ${confirmText}  ${cancelText}`;

    // Build buffer row by row to ensure perfect alignment
    buffer.push("┌" + "─".repeat(width - 2) + "┐");
    buffer.push(centeredLine("S  E  T  U  P"));
    buffer.push("├" + "═".repeat(width - 2) + "┤");
    buffer.push(contentLine("")); // Empty line
    buffer.push(contentLine(birthDateText));
    buffer.push(contentLine("")); // Empty line
    buffer.push(contentLine(lifeExpectancyText));
    buffer.push(contentLine("")); // Empty line
    buffer.push(centeredLine(instructionsLine));
    buffer.push("└" + "─".repeat(width - 2) + "┘");

    const instructionsY = overlayY + 9;
    const totalPadding = width - 2 - instructionsLine.length;
    const leftPad = Math.floor(totalPadding / 2);
    const startX = overlayX + 1 + leftPad;

    const confirmButtonRect: ButtonRect = {
        name: 'confirm',
        x: startX + instructionsText.length + 2,
        y: instructionsY,
        width: confirmText.length,
        height: 1,
    };

    const cancelButtonRect: ButtonRect = {
        name: 'cancel',
        x: startX + instructionsText.length + 2 + confirmText.length + 2,
        y: instructionsY,
        width: cancelText.length,
        height: 1,
    };

    return { buffer, fields, confirmButtonRect, cancelButtonRect };
}