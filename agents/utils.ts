/**
 * Utility functions for Cuttlefish Labs.
 */
export function simpleHash(data: string): number {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) & 0xFFFFFFFF;
  }
  return hash;
}

export function parseBlueprint(input: string): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON blueprint: ${error instanceof Error ? error.message : String(error)}`);
  }
}