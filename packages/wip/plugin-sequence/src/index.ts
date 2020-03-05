/* eslint-disable space-infix-ops */
import plugin, { HarkPlugin, HarkReporter, MaybeObject } from "@hark/plugin";

export type HarkPluginOrFalse<P0, P1> = HarkPlugin<P0, P1> | false;

export type TExtend<T1 extends MaybeObject, T2 extends MaybeObject> = {
  [K in Exclude<keyof T1, keyof T2>]: T1[K];
} &
  T2;

export type TExtend3<T1 extends MaybeObject, T2 extends MaybeObject, T3 extends MaybeObject> = TExtend<TExtend<T1, T2>, T3>;
export type TExtend4<T1 extends MaybeObject, T2 extends MaybeObject, T3 extends MaybeObject, T4 extends MaybeObject> = TExtend<
  TExtend3<T1, T2, T3>,
  T4
>;
export type TExtend5<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject
> = TExtend<TExtend4<T1, T2, T3, T4>, T5>;
export type TExtend6<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject
> = TExtend<TExtend5<T1, T2, T3, T4, T5>, T6>;
export type TExtend7<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject
> = TExtend<TExtend6<T1, T2, T3, T4, T5, T6>, T7>;
export type TExtend8<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject
> = TExtend<TExtend7<T1, T2, T3, T4, T5, T6, T7>, T8>;
export type TExtend9<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject
> = TExtend<TExtend8<T1, T2, T3, T4, T5, T6, T7, T8>, T9>;
export type TExtend10<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject
> = TExtend<TExtend9<T1, T2, T3, T4, T5, T6, T7, T8, T9>, T10>;
export type TExtend11<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject
> = TExtend<TExtend10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, T11>;
export type TExtend12<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject,
  T12 extends MaybeObject
> = TExtend<TExtend11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, T12>;
export type TExtend13<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject,
  T12 extends MaybeObject,
  T13 extends MaybeObject
> = TExtend<TExtend12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>, T13>;
export type TExtend14<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject,
  T12 extends MaybeObject,
  T13 extends MaybeObject,
  T14 extends MaybeObject
> = TExtend<TExtend13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>, T14>;
export type TExtend15<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject,
  T12 extends MaybeObject,
  T13 extends MaybeObject,
  T14 extends MaybeObject,
  T15 extends MaybeObject
> = TExtend<TExtend14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>, T15>;
export type TExtend16<
  T1 extends MaybeObject,
  T2 extends MaybeObject,
  T3 extends MaybeObject,
  T4 extends MaybeObject,
  T5 extends MaybeObject,
  T6 extends MaybeObject,
  T7 extends MaybeObject,
  T8 extends MaybeObject,
  T9 extends MaybeObject,
  T10 extends MaybeObject,
  T11 extends MaybeObject,
  T12 extends MaybeObject,
  T13 extends MaybeObject,
  T14 extends MaybeObject,
  T15 extends MaybeObject,
  T16 extends MaybeObject
> = TExtend<TExtend15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, T16>;

function sequence<P0, R>(p0: HarkPluginOrFalse<P0, R>): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend<P0, R>>;
function sequence<P0, P1, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend3<P0, P1, R>>;
function sequence<P0, P1, P2, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend4<P0, P1, P2, R>>;
function sequence<P0, P1, P2, P3, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend5<P0, P1, P2, P3, R>>;
function sequence<P0, P1, P2, P3, P4, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend6<P0, P1, P2, P3, P4, R>>;
function sequence<P0, P1, P2, P3, P4, P5, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend7<P0, P1, P2, P3, P4, P5, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend8<P0, P1, P2, P3, P4, P5, P6, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, P10>,
  p10: HarkPluginOrFalse<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend12<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, P10>,
  p10: HarkPluginOrFalse<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10>, P11>,
  p11: HarkPluginOrFalse<TExtend12<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend13<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, P10>,
  p10: HarkPluginOrFalse<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10>, P11>,
  p11: HarkPluginOrFalse<TExtend12<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11>, P12>,
  p12: HarkPluginOrFalse<TExtend13<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend14<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, P10>,
  p10: HarkPluginOrFalse<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10>, P11>,
  p11: HarkPluginOrFalse<TExtend12<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11>, P12>,
  p12: HarkPluginOrFalse<TExtend13<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12>, P13>,
  p13: HarkPluginOrFalse<TExtend14<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13>, R>,
): (reporter: HarkReporter) => (props?: P0) => Promise<TExtend15<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, R>>;
function sequence<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14, R>(
  p0: HarkPluginOrFalse<P0, P1>,
  p1: HarkPluginOrFalse<TExtend<P0, P1>, P2>,
  p2: HarkPluginOrFalse<TExtend3<P0, P1, P2>, P3>,
  p3: HarkPluginOrFalse<TExtend4<P0, P1, P2, P3>, P4>,
  p4: HarkPluginOrFalse<TExtend5<P0, P1, P2, P3, P4>, P5>,
  p5: HarkPluginOrFalse<TExtend6<P0, P1, P2, P3, P4, P5>, P6>,
  p6: HarkPluginOrFalse<TExtend7<P0, P1, P2, P3, P4, P5, P6>, P7>,
  p7: HarkPluginOrFalse<TExtend8<P0, P1, P2, P3, P4, P5, P6, P7>, P8>,
  p8: HarkPluginOrFalse<TExtend9<P0, P1, P2, P3, P4, P5, P6, P7, P8>, P9>,
  p9: HarkPluginOrFalse<TExtend10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9>, P10>,
  p10: HarkPluginOrFalse<TExtend11<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10>, P11>,
  p11: HarkPluginOrFalse<TExtend12<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11>, P12>,
  p12: HarkPluginOrFalse<TExtend13<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12>, P13>,
  p13: HarkPluginOrFalse<TExtend14<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13>, P14>,
  p14: HarkPluginOrFalse<TExtend15<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14>, R>,
): (
  reporter: HarkReporter,
) => (props?: P0) => Promise<TExtend16<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14, R>>;

function sequence(...plugins: HarkPluginOrFalse<any, any>[]) {
  return plugin("sequence", ({ reporter }: any) => (props: any) =>
    plugins.reduce(async (prev, next) => {
      if (next === false) {
        return prev;
      }

      const nextPluginRunner = await next;
      const prevProps = await prev;
      const result = await nextPluginRunner(reporter)(prevProps);

      return {
        ...prevProps,
        ...result,
      };
    }, Promise.resolve(props)),
  );
}

export default sequence;
