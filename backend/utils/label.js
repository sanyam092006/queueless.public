// Example: prefix "B", number 7 -> "B-007"
export const formatLabel = (prefix, number) => `${prefix}-${String(number).padStart(3, '0')}`;
