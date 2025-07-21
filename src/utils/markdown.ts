/**
 * Escapes special characters for Telegram MarkdownV2 format
 * @param text - The text to escape
 * @returns Escaped text safe for MarkdownV2
 */
export function escapeMarkdownV2(text: any): string {
  // Handle null, undefined, or non-string values
  if (text === null || text === undefined) {
    return '';
  }
  
  // Convert to string if it's not already
  const textStr = String(text);
  
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  
  let escaped = textStr;
  for (const char of specialChars) {
    escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  }
  
  return escaped;
}

/**
 * Creates a safe MarkdownV2 message by escaping all special characters
 * @param text - The text to format
 * @returns Safe MarkdownV2 text
 */
export function createSafeMarkdownMessage(text: string): string {
  return escapeMarkdownV2(text);
} 