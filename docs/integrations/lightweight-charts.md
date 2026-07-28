# Lightweight Charts integration

## Approved boundary

TradingView Lightweight Charts 5.2.0 is an optional rendering engine for the
existing Meridian OS chart workspace. It does not define Meridian domain
contracts, fetch data, infer provenance, or alter authentication, navigation,
providers, portfolio state, or database behavior.

The initial rollout is limited to the plot surface on `/charts`. Overview and
Markets continue to use the approved SVG chart. The existing SVG renderer also
remains the exact fallback on `/charts`.

## License and attribution

Lightweight Charts is distributed under the Apache License 2.0. Keep its
license and notices with distributed dependency notices.

The project additionally requires TradingView attribution on a public-facing
page where the library is used. The chart workspace renders the version 5.2.0
NOTICE text visibly with a restrained link to <https://www.tradingview.com/>:

- `TradingView Lightweight Charts™`
- `Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/`

Do not hide, obscure, or remove the attribution in responsive layouts. Review
the current requirements at
<https://github.com/tradingview/lightweight-charts> before every version
upgrade.

## Package and browser boundary

The frontend installs exactly `lightweight-charts@5.2.0`; its only declared
transitive dependency is `fancy-canvas@2.1.0`. The published package is an ES
module, includes `dist/typings.d.ts`, renders with HTML5 Canvas, and targets
modern browsers with ES2020 support. `ResizeObserver` is used when available;
the Meridian wrapper still supplies an initial fixed container size and owns
all subsequent resize reconciliation.

The renderer is code-split and loaded only when the `/charts` feature seam is
enabled. Disabling the flag leaves Overview and Markets on SVG and prevents the
optional chart chunk from being requested at runtime.

## Feature flag and rollback

`VITE_ENABLE_MERIDIAN_CHART_V2` is a compile-time, non-secret frontend flag.
It accepts only the exact strings `true` and `false` and defaults to `false`.
Any other configured value fails closed to `false`.

| Flag | `/charts` | Overview and Markets |
| --- | --- | --- |
| absent or `false` | Existing SVG renderer | Existing SVG renderer |
| `true` | Lightweight Charts renderer | Existing SVG renderer |

Rollback requires setting the flag to `false` and rebuilding the static
frontend. No data, schema, or migration rollback is involved.

## Meridian-owned data boundary

The chart receives `MeridianChartSeries`, not provider payloads or
Lightweight Charts types. Its contract requires:

- ISO 8601 candle timestamps with an explicit UTC offset
- a valid IANA display time zone
- finite OHLCV values and nonnegative volume
- internally consistent high and low values
- unique candles ordered by ascending timestamp
- matching `DataTruthState` and `DataProvenance`

Presentation labels are kept separately from timestamp keys. The adapter
converts validated instants to Lightweight Charts UTC timestamps. It also
rejects distinct source timestamps that would collide at the library's
whole-second precision.

MA8 and MA21 are deterministic simple moving averages over the validated close
series. They are presentation indicators, not provider observations.

Fixture expansion, interpolation, rescaling, or other derived candles must
remain labeled Historical, Demo, or Simulated through the Meridian contract.
The latest-quote endpoint must never be represented as historical candle data.

## State and provenance

Loading, empty, unavailable, delayed, historical, Demo, and simulated states
remain owned by Meridian UI outside the rendering engine. The adapter carries
truth state and provenance into its metadata without replacing or upgrading
them. It never fabricates provider, freshness, or market timestamps.

## Lifecycle requirements

The UI wrapper owns the imperative chart lifecycle:

- create exactly one chart for each mounted surface
- unsubscribe crosshair and visible-range listeners
- disconnect its `ResizeObserver`
- cancel queued animation work
- call `chart.remove()` during cleanup
- reconcile size and data after tab visibility resumes
- clear old series before symbol or timeframe replacement

Mobile vertical scrolling, keyboard-accessible summaries, reduced motion, and
the approved Meridian geometry must remain intact.

## Validation gate

Before enabling the flag outside local review:

1. Run the frontend typecheck and focused contract, adapter, lifecycle, chart,
   and route tests.
2. Run existing authentication and API tests.
3. Build the production frontend and record the bundle-size delta.
4. Inspect the browser console and repeat route, symbol, timeframe, expanded
   mode, resize, and hidden-tab cycles.
5. Verify desktop, tablet, and mobile scrolling and responsive attribution.
6. Confirm every derived data state remains visibly and correctly labeled.

Do not remove the SVG fallback or migrate another chart surface without a
separate approval.
