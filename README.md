# Tejvanta (तेजवन्त)

Brokerless TradingView-style trading terminal for charting, analysis, paper trading, options chain, market replay, and trading curriculum — all client-side with simulated market data.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + Tailwind CSS + LightweightCharts
- **Backend (optional)**: ASP.NET Core 10 Web API + Entity Framework Core + SignalR
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Real-time**: WebSocket via SignalR (backend) or client-side simulation (standalone)

## Project Structure

```
Tejvanta/
├── Tejvanta.Api/                       # ASP.NET Core Backend (optional)
│   ├── Program.cs                       # App startup & DI
│   ├── appsettings.json                 # Configuration
│   └── src/
│       ├── Domain/                      # Entities, ValueObjects, Service interfaces
│       ├── Infrastructure/              # Persistence, MarketData, PaperTrading, Options, Replay
│       ├── Application/                 # DTOs, Use Case handlers
│       └── API/
│           ├── Controllers/             # REST controllers
│           └── WebSockets/              # SignalR hubs & broadcasters
├── tejvanta-ui/                         # React Frontend (primary)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── components/
│   │   ├── charts/                  # TradingViewChart (pure canvas), PatternPanel, MultiChartLayout
│   │   ├── layout/                  # MainLayout, Sidebar (with WatchList), Header, SearchTicker
│   │   ├── trading/                 # OrderPanel, Positions, Orders, Basket, RiskDashboard,
│   │   │                            # JournalPanel, CoachingPanel, TradeOverlayEngine
│   │   ├── chartSettings/           # OrderMarkersLayer, StrategyTesterPanel, ChartSettingsModal
│   │   ├── options/                 # OptionsChain with Greeks
│   │   ├── replay/                  # ReplayController, ReplayChart
│   │   ├── drawing/                 # DrawingLayer, DrawingToolbar
│   │   ├── market/                  # WatchList with live prices
│   │   ├── training/                # StrategyTileCard, TileDetailPanel, QuizModal,
│   │   │                            # AnalyticsDashboard, SkillProgression
│   │   └── common/                  # Modal, Loader, ErrorBoundary, ConnectionIndicator
│   ├── hooks/                       # usePaperTrading, useMockData
│       ├── services/                    # marketEngine, mockDataEngine, TradeOverlayEngine,
│       │                                # pineScriptEngine, trainingEngine, patternEngine,
│       │                                # riskEngine, journalEngine, coachingEngine, indicatorEngine,
│       │                                # renkoEngine, backtestingEngine, challengeEngine,
│       │                                # quizEngine, learningEngine, bhavcopy, tradingService
│   ├── types/                       # TypeScript interfaces (Order, Instrument, chartSettings, orderTypes)
│   ├── pages/                       # ChartsPage, LearningPage, OptionsPage, ReplayPage, SettingsPage
│   ├── state/                       # Redux store & slices (market, trading, order, chartSettings, etc.)
│   ├── training/                    # curriculum.md, offline_modules.md, learning_module.md
│   └── config/                      # defaultWatchlist (ALL_SYMBOLS + TICKER_MAP)
├── database/
│   └── schema.sql                       # PostgreSQL schema
├── nginx.conf                           # Nginx config
├── setup.bat                            # One-click dependency install
├── run-backend.bat                      # Start backend server
├── run-frontend.bat                     # Start frontend dev server
├── run-all.bat                          # Start both servers
├── build.bat                            # Production build
├── kill-server.bat                      # Stop all servers
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+

### Run Frontend Only (No Backend Needed)

```bash
cd tejvanta-ui
npm install
npm run dev
```

Opens at `http://localhost:3000` — chart runs entirely on client-side simulation.

### With Backend (Optional)

```bat
setup.bat         # Install all dependencies (run once)
run-all.bat       # Start both backend + frontend
```

Or manually:

```bash
# Terminal 1 - Backend (http://localhost:5000)
cd Tejvanta.Api
dotnet run

# Terminal 2 - Frontend (http://localhost:3000)
cd tejvanta-ui
npm run dev
```

### Stop Servers

```bat
kill-server.bat
```

## Features

### Charts
- Pure canvas candle/OHLC chart (no external charting library dependency)
- Chart types: Candle, Renko, Line, Area, Bar
- Timeframes: 5s, 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W
- Multi-chart layouts: 1x1, 2x2, 4x4
- Technical indicators: SMA20, SMA50, EMA20, RSI14, ATR (engine-driven, toggleable)
- Crosshair with tooltip, mouse wheel zoom, pan/drag
- Right-click context menu with Reset Chart, Save as Image, Clear Data
- **TradeOverlayEngine** — renders SL/TP lines, entry markers, PnL labels, SL/TP zones, position lines directly on chart canvas; supports dynamic trailing SL and auto-close on SL/TP hit
- **DrawingToolbar** — floating on left side; trend lines, horizontal/vertical lines, rays, parallel channels, fib retracement/extension, rectangles, ellipses, text, brush, measure
- Full-width chart layout (no left gap) with absolute-positioned overlays

### Simulated Market Engine (`marketEngine.ts`)
- Runs entirely client-side — **no external API dependency**
- Wyckoff phase system: Accumulation → Manipulation → FVG → Distribution → Consolidation
- RSI-driven phase transitions with synthetic order flow tracking
- Realistic tick generation (5s interval, delta clamped to 0.05% of price)
- Seeded PRNG per symbol via djb2 hash for deterministic replay
- Initial candles seeded on mount (30–120 per timeframe)
- Streaming ticks update current candle or create new one every 5s

### Paper Trading
- TradingView-style Order Panel with prominent BUY (ask) / SELL (bid) price display and spread
- Market and Limit orders with quantity quick-select (10/25/50/100%)
- Stop Loss and Take Profit fields with order value calculation
- Virtual balance: ₹10,00,000 starting capital
- Position tracking with unrealized/realized PnL, close/reverse actions
- Basket orders (multi-symbol simultaneous orders)
- Auto SL/TP trigger on tick via TradeOverlayEngine

### Pine Script Engine (`pineScriptEngine.ts`)
- Line-by-line interpreter (pure TS, no WASM)
- Supported functions: `indicator()`, `plot()`, `sma()`, `ema()`, `rsi()`, `input()`
- Built-in variables: `close`, `high`, `low`, `open`, `volume`
- Script editor with New/Apply/Delete and enable toggle
- Scripts persisted to localStorage
- Plot outputs render as overlay LineSeries on chart

### Pattern Recognition Engine (`patternEngine.ts`)
- 6 detectors running every 6th tick:
  - **Flag** — tight consolidation after a sharp move (volume declining)
  - **Pennant** — converging trend lines after a sharp move (volume declining)
  - **Double Top** — two equal highs with a valley between
  - **Double Bottom** — two equal lows with a peak between
  - **Volume Compression** — volume dropping below 50% of avg (suggests breakout)
  - **Liquidity Shock** — volume spike >2× avg with mean reversion
- Confidence scoring (0–1) per detection
- Overlay markers + price lines rendered on the chart
- Pattern panel (toggled by `△` button on chart) listing all detected patterns with severity colors

### Risk Management System (`riskEngine.ts` + `RiskDashboard.tsx`)
- Daily loss limit (configurable % of equity)
- Maximum drawdown tracking (from peak equity)
- Position size calculator: entry price, stop loss, account risk %
- Adaptive risk per trade — halves after 3 consecutive losses, quarters after 5
- `checkTradeAllowed()` guard — blocks trading if daily loss or max drawdown exceeded
- Config sliders persisted to localStorage
- Accessed via **risk** tab in PaperTradingPanel

### Trade Journal System (`journalEngine.ts` + `JournalPanel.tsx`)
- CRUD journal entries with localStorage persistence
- Entry fields: symbol, side, entry/exit price, qty, PnL, R multiple
- Tagging system: strategy tags, emotion tags, mistake tags
- Setup & execution ratings (1–5), free-text notes & lessons learned
- **Monthly reports**: total trades, win rate, avg R, profit factor, expectancy
- Aggregated breakdowns by strategy, emotion, mistake
- Top lessons extracted across trades
- **Discipline score** (0–100) — auto-calculated from mistakes and good habits
- Accessed via **journal** tab in PaperTradingPanel

### Coaching AI (`coachingEngine.ts` + `CoachingPanel.tsx`)
- 8 coaching rules with severity-graded feedback:
  - **Critical**: No SL entry, revenge trading, daily loss limit hit
  - **Warning**: FOMO detection, daily loss near limit, consecutive losses
  - **Info**: Tight stop loss, no confirmation candle
- Each alert includes a specific, actionable suggestion
- Test entry & simulate loss buttons for demo
- Mute per rule, critical alert banner
- Accessed via **AI Coach** tab in PaperTradingPanel

### Trading Curriculum (`/learn`)
- 4 levels: Foundation → Pattern & Breakout → Professional → System Builder
- 13 strategy modules with entry/SL/TP rules, instrument filters, timeframe
- 19 mock data patterns with live candlestick preview (via lightweight-charts)
- 11 replay scenarios
- Level filter tabs, tile detail modal (rules, patterns, replays, progress tabs)
- Strategy instruments map to real watchlist symbols: NIFTY, RELIANCE, TCS, HDFCBANK (via `TICKER_MAP` in `defaultWatchlist.ts`)
- XP counter, tile completion tracking, streak fire, next-up recommendation
- Full curriculum document at `src/training/curriculum.md`
- Architecture plan for future modules at `src/training/offline_modules.md`

### Options Chain
- Calls/Puts organized by strike price
- LTP, bid/ask, open interest, volume, IV
- Weekly expiry selection
- Click any contract to open Order Panel

### Market Replay
- Playback at variable speeds (0.5x – 8x)
- Date range selection, pause/resume/stop controls
- Progress tracking with percentage and current time

### Settings
- Dark/Light theme toggle
- Default timeframe and layout
- Chart: Renko brick %, wicks toggle, volume toggle

## Simulated Market Data (Client-Side)

The `marketEngine.ts` service generates realistic price ticks, and `mockDataEngine.ts` seeds Redux with 3-day tick history for all 14 watchlist symbols on mount. Ticks advance every 3 seconds for live price simulation. The watchlist sidebar shows all symbols with live prices, change %, and change direction.

| Feature | Detail |
|---------|--------|
| Tick interval | 5 seconds |
| Phases | Accumulation, Manipulation, FVG, Distribution, Consolidation |
| Phase transitions | Driven by smoothed RSI (14-period) and order flow net imbalance |
| Tick delta | Clamped to 0.05% of current price per tick |
| Drift per phase | 0.01 (acc) / 0.12 (manip) / −0.05 (dist) / 0.0 (cons/FVG) |
| Mean reversion | Active in accumulation (0.12) and consolidation (0.15) phases |
| Order flow | Synthetic buy/sell volume based on tick direction |
| Initial candles | 30–120 candles seeded on mount |
| Streaming | `generateTickStream` every 5s |
| Deterministic | Seeded PRNG per symbol via djb2 hash |

## Offline Modules (Planned)

Based on `src/training/offline_modules.md`:

- Backtesting Engine — run strategies on historical/hypothetical data
- Options Strategy Builder — multi-leg payoff charts, IV surface
- Multi-Portfolio — separate accounts with different strategies
- Local Sharing — export/import trades, journals, scripts
- Mobile UI — responsive layout for phone/tablet

## API Endpoints (Backend Mode Only)

### REST

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/instruments | List all instruments |
| GET | /api/instruments/search?q= | Search instruments |
| GET | /api/market/ohlc?symbol=&from=&to=&timeframe= | OHLC candles |
| GET | /api/market/ticks/latest?symbol= | Latest tick |
| POST | /api/orders/place | Place paper order |
| POST | /api/orders/cancel | Cancel order |
| GET | /api/orders | List orders |
| GET | /api/positions | List positions |
| POST | /api/positions/close | Close position |
| POST | /api/positions/reverse | Reverse position |
| GET | /api/options/chain?symbol=&expiry= | Options chain |
| GET | /api/options/expiries?symbol= | Available expiries |
| POST | /api/replay/start | Start market replay |
| POST | /api/replay/stop | Stop replay |
| POST | /api/replay/pause | Pause replay |
| POST | /api/replay/resume | Resume replay |
| GET | /api/replay/state?instrumentId= | Replay state |
| GET | /api/settings | Get user settings |
| POST | /api/settings | Update settings |

### WebSocket (SignalR)

| Hub | Path | Events (Server → Client) |
|-----|------|---------------------------|
| MarketDataHub | /ws/market/ticks | Tick |
| TradingHub | /ws/trading | OrderUpdated, PositionUpdated |
| OptionsHub | /ws/options | OptionsChainUpdated |
| ReplayHub | /ws/replay | ReplayTick, ReplayState |

## Architecture Notes

- **Client-first**: All core services (market engine, PineScript, pattern detection, risk, journal, coaching) run in the browser with zero backend dependency
- **Clean Architecture**: Domain → Infrastructure → Application → API (backend only)
- **SOLID Principles**: DI throughout, interface-based services
- **Pine Script engine**: Pure-TS interpreter with no WASM or external dependency
- **Paper Trading Engine**: Full order lifecycle with SL/TP auto-trigger on incoming ticks
- **Seeded randomness**: All simulated data uses deterministic PRNG for reproducible patterns
- **No broker integration**: All trading is virtual, no real-money risk

## Contributors

- **bhnvboy-cell** — lead developer
- **M.P. ABHINAV** — contributor
- **M.P. ABHIRAM** — contributor

## License

MIT
