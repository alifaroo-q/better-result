import { describe, expectTypeOf, it } from "vitest";
import { Result } from "./index";

declare const result: Result<string, Error>;
declare function json<T>(body: T, status?: number): { body: T; status: number };

describe("Result.match", () => {
  it("unions divergent handler returns", () => {
    const outcome = result.match({
      ok: (value) => ({ value }),
      err: () => ({ error: "Something went wrong" }),
    });

    expectTypeOf(outcome).toEqualTypeOf<{ value: string } | { error: string }>();
  });

  it("unions divergent primitive returns", () => {
    const outcome = result.match({ ok: (value) => value.length, err: () => "none" });

    expectTypeOf(outcome).toEqualTypeOf<number | string>();
  });

  it("unions handler returns on narrowed Ok and Err receivers", () => {
    const fromOk = Result.ok(1).match({ ok: (value) => value, err: () => "none" });
    const fromErr = Result.err("fail").match({ ok: () => 1, err: (error) => error });

    expectTypeOf(fromOk).toEqualTypeOf<number | string>();
    expectTypeOf(fromErr).toEqualTypeOf<number | string>();
  });

  it("unions handler returns in data-first and data-last forms", () => {
    const dataFirst = Result.match(result, { ok: (value) => value.length, err: () => "none" });
    const dataLast = Result.match({ ok: (value: string) => value.length, err: () => "none" })(
      result,
    );

    expectTypeOf(dataFirst).toEqualTypeOf<number | string>();
    expectTypeOf(dataLast).toEqualTypeOf<number | string>();
  });

  it("keeps the explicit <T, R> type argument positions", () => {
    const outcome = result.match<string, Result<string, Error>>({
      ok: (value) => value,
      err: (error) => error.message,
    });

    expectTypeOf(outcome).toEqualTypeOf<string>();
  });

  it("keeps distinct typed responses per branch", () => {
    const outcome = result.match({
      ok: (value) => json({ data: value }),
      err: () => json({ error: "bad" }, 500),
    });

    expectTypeOf(outcome).toEqualTypeOf<
      { body: { data: string }; status: number } | { body: { error: string }; status: number }
    >();
  });

  it("adds nothing for a throwing handler", () => {
    const outcome = result.match({
      ok: (value) => value,
      err: () => {
        throw new Error("unreachable");
      },
    });

    expectTypeOf(outcome).toEqualTypeOf<string>();
  });

  it("checks both handlers against a single explicit type argument", () => {
    const outcome = result.match<{ title?: string }>({
      ok: () => ({ title: "x" }),
      err: () => ({}),
    });

    expectTypeOf(outcome).toEqualTypeOf<{ title?: string }>();

    // @ts-expect-error - err handler must return the explicit type
    result.match<number>({ ok: (value) => value.length, err: () => "none" });
  });
});
