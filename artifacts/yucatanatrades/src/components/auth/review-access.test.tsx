import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ReviewAccessCodeForm,
  ReviewAccessEntry,
} from "./review-access.tsx";

const submit = async () => undefined;

describe("Review Access presentation", () => {
  it("renders nothing unless the server feature is explicitly enabled", () => {
    expect(renderToStaticMarkup(
      <ReviewAccessEntry enabled={false} onSubmit={submit} />,
    )).toBe("");
  });

  it("offers a discreet development review action when enabled", () => {
    const markup = renderToStaticMarkup(
      <ReviewAccessEntry enabled onSubmit={submit} />,
    );
    expect(markup).toContain("Owner Review Access");
    expect(markup).toContain("Local development only");
    expect(markup).not.toContain("Review access code digit");
  });

  it("renders six accessible, initially empty code cells", () => {
    const markup = renderToStaticMarkup(
      <ReviewAccessCodeForm onSubmit={submit} onCancel={() => undefined} />,
    );
    expect(markup.match(/Review access code digit/g)).toHaveLength(6);
    expect(markup).toContain("Development-only session");
    expect(markup).not.toMatch(/value="[0-9]"/);
  });
});
