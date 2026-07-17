export const REVIEW_ACCESS_CODE_LENGTH = 6;

export type ReviewAccessCells = [string, string, string, string, string, string];

export function emptyReviewAccessCells(): ReviewAccessCells {
  return ["", "", "", "", "", ""];
}

export function normalizeReviewAccessCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, REVIEW_ACCESS_CODE_LENGTH);
}

export function insertReviewAccessDigits(
  current: ReviewAccessCells,
  startIndex: number,
  value: string,
): { cells: ReviewAccessCells; focusIndex: number } {
  const digits = normalizeReviewAccessCode(value);
  const cells = [...current] as ReviewAccessCells;
  const safeStart = Math.min(
    REVIEW_ACCESS_CODE_LENGTH - 1,
    Math.max(0, startIndex),
  );

  for (let offset = 0; offset < digits.length; offset += 1) {
    const target = safeStart + offset;
    if (target >= REVIEW_ACCESS_CODE_LENGTH) break;
    cells[target] = digits[offset] ?? "";
  }

  return {
    cells,
    focusIndex: Math.min(
      REVIEW_ACCESS_CODE_LENGTH - 1,
      safeStart + Math.max(0, digits.length),
    ),
  };
}

export function reviewAccessBackspaceTarget(
  cells: ReviewAccessCells,
  index: number,
): number {
  if (cells[index]) return index;
  return Math.max(0, index - 1);
}
