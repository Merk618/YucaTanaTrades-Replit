import { describe, expect, it } from "vitest";
import {
  REVIEW_ACCESS_CODE_LENGTH,
  emptyReviewAccessCells,
  insertReviewAccessDigits,
  normalizeReviewAccessCode,
  reviewAccessBackspaceTarget,
} from "./review-access-code.ts";

const digits = Array.from(
  { length: REVIEW_ACCESS_CODE_LENGTH },
  (_, index) => String((index + 3) % 10),
).join("");

describe("Review Access code entry", () => {
  it("accepts only six numeric characters", () => {
    expect(normalizeReviewAccessCode(`x${digits}y9`)).toBe(digits);
    expect(normalizeReviewAccessCode("letters-only")).toBe("");
  });

  it("distributes a pasted code across all six cells", () => {
    const result = insertReviewAccessDigits(emptyReviewAccessCells(), 0, digits);
    expect(result.cells.join("")).toBe(digits);
    expect(result.focusIndex).toBe(REVIEW_ACCESS_CODE_LENGTH - 1);
  });

  it("supports insertion and backward keyboard movement without retaining extra input", () => {
    const partial = insertReviewAccessDigits(emptyReviewAccessCells(), 2, digits.slice(0, 2));
    expect(partial.cells.slice(2, 4).join("")).toBe(digits.slice(0, 2));
    expect(reviewAccessBackspaceTarget(partial.cells, 5)).toBe(4);
    expect(reviewAccessBackspaceTarget(partial.cells, 3)).toBe(3);
  });
});
