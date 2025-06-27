/**
 * Pattern generation utilities converted from Python code
 * Generates E164 patterns from number ranges
 */

export interface PatternResult {
  start: number;
  end: number;
  pattern: string;
}

export interface RangePatternResult {
  startPatterns: number[];
  stopPatterns: number[];
  subpatterns: string[];
  patterns: PatternResult[];
}

/**
 * Main function to generate regex patterns for a given range
 */
export function regexForRange(min: number, max: number): RangePatternResult {
  let positiveSubpatterns: string[] = [];
  let negativeSubpatterns: string[] = [];
  let startSubpatterns: number[] = [];
  let stopSubpatterns: number[] = [];

  let minAdjusted = min;

  if (min < 0) {
    let minAbs = 1;
    if (max < 0) {
      minAbs = Math.abs(max);
    }
    const maxAbs = Math.abs(min);

    const negativeResult = splitToPatterns(minAbs, maxAbs);
    negativeSubpatterns = negativeResult.subpatterns;
    startSubpatterns = negativeResult.startPatterns;
    stopSubpatterns = negativeResult.stopPatterns;

    minAdjusted = 0;
  }

  if (max >= 0) {
    const positiveResult = splitToPatterns(minAdjusted, max);
    positiveSubpatterns = positiveResult.subpatterns;
    startSubpatterns = positiveResult.startPatterns;
    stopSubpatterns = positiveResult.stopPatterns;
  }

  const negativeOnlySubpatterns = negativeSubpatterns
    .filter(val => !positiveSubpatterns.includes(val))
    .map(val => '-' + val);
  
  const positiveOnlySubpatterns = positiveSubpatterns
    .filter(val => !negativeSubpatterns.includes(val));
  
  const intersectedSubpatterns = negativeSubpatterns
    .filter(val => positiveSubpatterns.includes(val))
    .map(val => '-?' + val);

  const subpatterns = [
    ...negativeOnlySubpatterns,
    ...intersectedSubpatterns,
    ...positiveOnlySubpatterns
  ];

  // Create patterns array for easier consumption
  const patterns: PatternResult[] = [];
  for (let i = 0; i < startSubpatterns.length; i++) {
    patterns.push({
      start: startSubpatterns[i],
      end: stopSubpatterns[i],
      pattern: subpatterns[i] || positiveSubpatterns[i] || ''
    });
  }

  return {
    startPatterns: startSubpatterns,
    stopPatterns: stopSubpatterns,
    subpatterns,
    patterns
  };
}

/**
 * Split range into patterns
 */
function splitToPatterns(min: number, max: number): RangePatternResult {
  const subpatterns: string[] = [];
  const startPatterns: number[] = [];
  const stopPatterns: number[] = [];

  let start = min;
  const ranges = splitToRanges(min, max);
  
  for (const stop of ranges) {
    startPatterns.push(start);
    stopPatterns.push(stop);
    subpatterns.push(rangeToPattern(start, stop));
    start = stop + 1;
  }

  const patterns: PatternResult[] = [];
  for (let i = 0; i < startPatterns.length; i++) {
    patterns.push({
      start: startPatterns[i],
      end: stopPatterns[i],
      pattern: subpatterns[i]
    });
  }

  return {
    startPatterns,
    stopPatterns,
    subpatterns,
    patterns
  };
}

/**
 * Split range into optimal sub-ranges
 */
function splitToRanges(min: number, max: number): number[] {
  const stops = new Set<number>([max]);

  let ninesCount = 1;
  let stop = fillByNines(min, ninesCount);
  while (min <= stop && stop < max) {
    stops.add(stop);
    ninesCount++;
    stop = fillByNines(min, ninesCount);
  }

  let zerosCount = 1;
  stop = fillByZeros(max + 1, zerosCount) - 1;
  while (min < stop && stop <= max) {
    stops.add(stop);
    zerosCount++;
    stop = fillByZeros(max + 1, zerosCount) - 1;
  }

  const sortedStops = Array.from(stops).sort((a, b) => a - b);
  return sortedStops;
}

/**
 * Fill number with nines
 */
function fillByNines(integer: number, ninesCount: number): number {
  const str = integer.toString();
  if (ninesCount >= str.length) {
    return integer;
  }
  const prefix = str.slice(0, -ninesCount);
  const suffix = '9'.repeat(ninesCount);
  return parseInt(prefix + suffix);
}

/**
 * Fill number with zeros
 */
function fillByZeros(integer: number, zerosCount: number): number {
  return integer - (integer % Math.pow(10, zerosCount));
}

/**
 * Convert range to pattern
 */
function rangeToPattern(start: number, stop: number): string {
  let pattern = '';
  let anyDigitCount = 0;

  const startStr = start.toString();
  const stopStr = stop.toString();

  // Pad shorter number with leading zeros
  const maxLength = Math.max(startStr.length, stopStr.length);
  const paddedStart = startStr.padStart(maxLength, '0');
  const paddedStop = stopStr.padStart(maxLength, '0');

  for (let i = 0; i < maxLength; i++) {
    const startDigit = paddedStart[i];
    const stopDigit = paddedStop[i];

    if (startDigit === stopDigit) {
      pattern += startDigit;
    } else if (startDigit !== '0' || stopDigit !== '9') {
      if (startDigit > stopDigit) {
        pattern += `[${stopDigit}-${startDigit}]`;
      } else {
        pattern += `[${startDigit}-${stopDigit}]`;
      }
    } else {
      anyDigitCount++;
    }
  }

  if (anyDigitCount > 0) {
    pattern += 'X'.repeat(anyDigitCount);
  }

  return pattern;
}

/**
 * Get first digit of a number
 */
export function firstDigit(n: number): number {
  while (n >= 10) {
    n = Math.floor(n / 10);
  }
  return n;
}

/**
 * Get last digit of a number
 */
export function lastDigit(n: number): number {
  return n % 10;
}

/**
 * Generate DID range description
 */
export function didToRange(start: number, stop: number): string {
  if ((lastDigit(start) === 0 && lastDigit(stop) === 9) || start === stop) {
    const pattern = rangeToPattern(start, stop);
    return `DID Range ${start} - ${stop}\nPattern: ${pattern}\n`;
  } else {
    let reply = `DID Range ${start} - ${stop}\nSub Range:\n`;
    const patterns = regexForRange(start, stop);
    
    for (const pattern of patterns.patterns) {
      reply += `Start: ${pattern.start}, End: ${pattern.end}, Pattern: ${pattern.pattern}\n`;
    }
    
    return reply;
  }
}
