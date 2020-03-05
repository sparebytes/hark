import { reporterVerbose } from "@hark/reporter-verbose";
import { combineLatest, empty, of } from "rxjs";
import { delay, map, switchMap, tap } from "rxjs/operators";
import { plugin } from "./plugin";

function getRootMonoad(data?: any, reporterOptions?: any) {
  const reporter = reporterVerbose({ ...reporterOptions, logLevel: 2 });
  const rootMonad = plugin.monadRoot(reporter, [], data);
  return rootMonad;
}

describe("plugin", () => {
  describe("rxjs", () => {
    test("tap", async () => {
      const mockCallback = jest.fn();
      await getRootMonoad()
        .pipe(plugin([], tap(mockCallback)))
        .toPromise();
      expect(mockCallback.mock.calls.length).toBe(1);
    });
    test("map", async () => {
      const result = await getRootMonoad(1)
        .pipe(
          plugin(
            [],
            map((z) => z + 1),
          ),
        )
        .toPromise();
      expect(result).toBe(2);
    });
    test("switchMap", async () => {
      const result = await getRootMonoad(1)
        .pipe(
          plugin(
            [],
            switchMap((z) => of(z + 1)),
          ),
        )
        .toPromise();
      expect(result).toBe(2);
    });
  });
});
test("plugin.combineLatest", async () => {
  const result = await getRootMonoad(1)
    .pipe(
      plugin.combineLatest(
        //
        plugin.of(1),
        plugin.of("B"),
        plugin.of("last"),
      ),
    )
    .toPromise();
  expect(result).toMatchObject([1, "B", "last"]);
});
describe("plugin.combineLatestArray", () => {
  test("empty", async () => {
    const result = await getRootMonoad(1)
      .pipe(plugin.combineLatestArray([]))
      .toPromise();
    expect(result).toMatchObject([]);
  });
  test("empty w/ fallback", async () => {
    const result = await getRootMonoad(1)
      .pipe(plugin.combineLatestArray([], plugin.of("fallback")))
      .toPromise();
    expect(result).toEqual("fallback");
  });
  test("not empty", async () => {
    const result = await getRootMonoad(1)
      .pipe(plugin.combineLatestArray([plugin.of("B")]))
      .toPromise();
    expect(result).toMatchObject(["B"]);
  });
  test("not empty w/ fallback", async () => {
    const result = await getRootMonoad(1)
      .pipe(plugin.combineLatestArray([plugin.of("B")]), plugin.of("fallback"))
      .toPromise();
    expect(result).toEqual("fallback");
  });
});
test("plugin.concat", async () => {
  const mockCallback = jest.fn();
  const result = await getRootMonoad(1)
    .pipe(
      plugin.concat<any, string | number>(
        //
        plugin.of(1),
        plugin.pipe(plugin.of("B"), delay(10)),
        plugin.of("last"),
      ),
      tap(mockCallback),
    )
    .toPromise();
  expect(mockCallback).toBeCalledTimes(3);
  expect(mockCallback).toBeCalledWith(1);
  expect(mockCallback).toBeCalledWith("B");
  expect(mockCallback).toBeCalledWith("last");
  expect(result).toEqual("last");
});
test("plugin.merge", async () => {
  const mockCallback = jest.fn();
  const result = await getRootMonoad(1)
    .pipe(
      plugin.merge<any, string | number>(
        //
        plugin.of(1),
        plugin.pipe(plugin.of("B"), delay(10)),
        plugin.of("last"),
      ),
      tap(mockCallback),
    )
    .toPromise();
  expect(mockCallback).toBeCalledTimes(3);
  expect(mockCallback).toBeCalledWith(1);
  expect(mockCallback).toBeCalledWith("B");
  expect(mockCallback).toBeCalledWith("last");
  expect(result).toEqual("B");
});
test("plugin.collect", async () => {
  const mockCallback = jest.fn();
  const result = await getRootMonoad(1)
    .pipe(
      plugin.collect(
        //
        plugin.of(1),
        plugin.pipe(plugin.of("B"), delay(10)),
        plugin.of("last"),
      ),
      switchMap((z) => combineLatest(...z)),
      tap(mockCallback),
    )
    .toPromise();
  expect(result).toMatchObject([1, "B", "last"]);
});
test("plugin.ifEmpty", async () => {
  const result = await getRootMonoad(1)
    .pipe(plugin.ifEmpty(plugin.from(empty()), plugin.of("fallback")))
    .toPromise();
  expect(result).toEqual("fallback");
});
