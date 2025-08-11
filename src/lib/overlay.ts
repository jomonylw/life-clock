import { EditableField } from "@/hooks/useLifeMonitorState";

export interface FieldRect {
    name: EditableField;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ButtonRect {
  name: 'confirm' | 'cancel' | 'edit' | 'switch' | 'adjustUp' | 'adjustDown';
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
    adjustUpButtonRect: ButtonRect | null;
    adjustDownButtonRect: ButtonRect | null;
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
    const yearStrDisplay = activeField === 'year' ? `[${yearStr}]` : yearStr;
    const monthStrDisplay = activeField === 'month' ? `[${monthStr}]` : monthStr;
    const dayStrDisplay = activeField === 'day' ? `[${dayStr}]` : dayStr;
    const lifeExpectancyValue = activeField === 'lifeExpectancy' ? `[${lifeExpectancyStr}]` : ` ${lifeExpectancyStr} `;

    const yearX = birthDateLabel.length + 1;
    const monthX = yearX + yearStrDisplay.length + 1; // +1 for '/'
    const dayX = monthX + monthStrDisplay.length + 1; // +1 for '/'

    fields.push({ name: 'year', x: overlayX + yearX, y: overlayY + yPos, width: yearStrDisplay.length, height: 1 });
    fields.push({ name: 'month', x: overlayX + monthX, y: overlayY + yPos, width: monthStrDisplay.length, height: 1 });
    fields.push({ name: 'day', x: overlayX + dayX, y: overlayY + yPos, width: dayStrDisplay.length, height: 1 });

    const lifeExpectancyLabel = " Life Expectancy (Years): ";
    const lifeExpectancyX = lifeExpectancyLabel.length + 1;
    const lifeExpectancyY = yPos + 2;
    fields.push({ name: 'lifeExpectancy', x: overlayX + lifeExpectancyX, y: overlayY + lifeExpectancyY, width: lifeExpectancyValue.length, height: 1 });

    const birthDateValues = `${yearStrDisplay}/${monthStrDisplay}/${dayStrDisplay}`;

    const adjustButtonsText = "  [ ▲ ] [ ▼ ]"; // Further increased spacing
    let birthDateText = `${birthDateLabel}${birthDateValues}`;
    let lifeExpectancyText = `${lifeExpectancyLabel}${lifeExpectancyValue}`;

    let adjustUpButtonRect: ButtonRect | null = null;
    let adjustDownButtonRect: ButtonRect | null = null;

    const activeFieldRect = fields.find(f => f.name === activeField);

    if (activeFieldRect) {
        const isDateField = activeField === 'year' || activeField === 'month' || activeField === 'day';
        const isLifeExpectancyField = activeField === 'lifeExpectancy';

        let buttonX: number;
        let buttonY: number;

        if (isDateField) {
            buttonX = overlayX + birthDateText.length;
            buttonY = overlayY + yPos;
            birthDateText += adjustButtonsText;
        } else if (isLifeExpectancyField) {
            buttonX = overlayX + lifeExpectancyText.length;
            buttonY = overlayY + lifeExpectancyY;
            lifeExpectancyText += adjustButtonsText;
        } else {
            buttonX = 0;
            buttonY = 0;
        }

        if (buttonX > 0) {
            adjustUpButtonRect = {
                name: 'adjustUp',
                x: buttonX + 3, // Adjusted for new spacing "   [ ▲ ]"
                y: buttonY,
                width: 5,      // Width of "[ ▲ ]"
                height: 1,
            };
            adjustDownButtonRect = {
                name: 'adjustDown',
                x: buttonX + 9, // Adjusted for new spacing "   [ ▲ ] [ ▼ ]"
                y: buttonY,
                width: 5,      // Width of "[ ▼ ]"
                height: 1,
            };
        }
    }
    
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

    return { buffer, fields, confirmButtonRect, cancelButtonRect, adjustUpButtonRect, adjustDownButtonRect };
}