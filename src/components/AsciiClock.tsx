import React from 'react';

const DIGITS: { [key: string]: string[] } = {
  '0': ["███", "█ █", "█ █", "█ █", "███"],
  '1': [" █ ", "██ ", " █ ", " █ ", "███"],
  '2': ["███", "  █", "███", "█  ", "███"],
  '3': ["███", "  █", " ██", "  █", "███"],
  '4': ["█ █", "█ █", "███", "  █", "  █"],
  '5': ["███", "█  ", "███", "  █", "███"],
  '6': ["███", "█  ", "███", "█ █", "███"],
  '7': ["███", "  █", "  █", "  █", "  █"],
  '8': ["███", "█ █", "███", "█ █", "███"],
  '9': ["███", "█ █", "███", "  █", "███"],
  ':': ["   ", " █ ", "   ", " █ ", "   "],
  ' ': ["   ", "   ", "   ", "   ", "   "], // For blinking
};

const AsciiClock = ({ now }: { now: Date }) => {
  const timeStr = now.toTimeString().slice(0, 8);
  const seconds = now.getSeconds();
  const output = Array(5).fill('');

  for (const char of timeStr) {
    let digit;
    if (char === ':' && seconds % 2 !== 0) {
      digit = DIGITS[' '];
    } else {
      digit = DIGITS[char];
    }
    
    if (digit) {
      for (let i = 0; i < 5; i++) {
        output[i] += digit[i] + ' ';
      }
    }
  }

  return (
    <div>
      {output.map((line, index) => (
        <pre key={index}>{line}</pre>
      ))}
    </div>
  );
};

export default AsciiClock;

export const getAsciiClockStringArray = (now: Date): string[] => {
    const timeStr = now.toTimeString().slice(0, 8);
    const seconds = now.getSeconds();
    const output = Array(5).fill('');

    for (const char of timeStr) {
        let digit;
        if (char === ':' && seconds % 2 !== 0) {
            digit = DIGITS[' '];
        } else {
            digit = DIGITS[char];
        }

        if (digit) {
            for (let i = 0; i < 5; i++) {
                output[i] += digit[i] + ' ';
            }
        }
    }
    return output;
}