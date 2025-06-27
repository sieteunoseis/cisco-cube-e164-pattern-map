// Test script for pattern generation
import { regexForRange, didToRange } from '../frontend/src/lib/pattern-generator';

// Test examples based on the original Python code
console.log('Testing pattern generation...\n');

// Test 1: Simple range
console.log('Test 1: Range 5551000-5551999');
const result1 = regexForRange(5551000, 5551999);
console.log('Patterns:', result1.patterns);
console.log('Description:', didToRange(5551000, 5551999));
console.log('---');

// Test 2: Smaller range
console.log('Test 2: Range 100-199');
const result2 = regexForRange(100, 199);
console.log('Patterns:', result2.patterns);
console.log('Description:', didToRange(100, 199));
console.log('---');

// Test 3: Single number
console.log('Test 3: Range 1234-1234');
const result3 = regexForRange(1234, 1234);
console.log('Patterns:', result3.patterns);
console.log('Description:', didToRange(1234, 1234));
console.log('---');

// Test 4: Cross decade boundary
console.log('Test 4: Range 95-105');
const result4 = regexForRange(95, 105);
console.log('Patterns:', result4.patterns);
console.log('Description:', didToRange(95, 105));

console.log('\nPattern generation test completed successfully!');
