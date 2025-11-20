/**
 * Recursively converts null values to undefined in an object
 * This is needed because Zod's .optional() only accepts undefined, not null
 */
export function nullToUndefined<T>(obj: T): T {
  if (obj === null) {
    return undefined as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => nullToUndefined(item)) as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const result = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (result as any)[key] = nullToUndefined((obj as any)[key]);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Extracts JSON from a string that might be wrapped in markdown code blocks or XML tags
 */
export function extractJsonString(response: string): string {
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }
  if (jsonStr.includes('<JSON>')) {
    const match = jsonStr.match(/<JSON>([\s\S]*?)<\/JSON>/);
    if (match) {
      jsonStr = match[1].trim();
    }
  }
  return jsonStr;
}

