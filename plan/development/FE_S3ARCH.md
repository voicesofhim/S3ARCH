## S3ARCH Frontend Plan (Gateway-ready, ArNS-compatible) - UPDATED 2025-01-29

Goals
- Build a production-ready frontend for S3ARCH that connects to TIM3 AO processes (lock/swap flows), supports Wander wallet login, and is deployable to the permaweb with ArNS pointing to `ar://s3arch` and public domain `s3ar.ch`.
- Ensure compatibility with AR.IO gateways, Wayfinder `ar://` resolution, and a future HyperBEAM-based attention analytics module (no-auth required).

## 🎉 CURRENT STATUS: PRODUCTION SWAP UI COMPLETE WITH REAL USDA
- ✅ **Wallet Integration**: Wander wallet connection working via Arweave Wallet Kit
- ✅ **Swap UI**: Clean card-based interface for USDA → TIM3 swaps with validation
- ✅ **AO Integration**: Full aoconnect library integration with proper response parsing
- ✅ **TIM3 Process Connection**: All 5 production TIM3 processes integrated and tested
- ✅ **Production USDA**: Integrated production USDA process (FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8)
- ✅ **Balance Queries**: Real-time USDA and TIM3 balance display
- ✅ **Swap Validation**: Min 1 USDA, Max 100,000 USDA per transaction
- 📝 **Documentation**: Comprehensive implementation log and planning docs updated

## 🔧 TECHNICAL CHALLENGES & SOLUTIONS

### Wallet Integration Issues (RESOLVED)
**Problem**: Wander wallet popup would appear but remain blank, timing out with "auth_request_ready" errors.
**Root Cause**: Browser extension needed restart; not an application issue.
**Solution**: User restarted Chrome browser, wallet worked immediately on other Arweave sites.
**Lesson**: Always test wallet functionality on other sites to isolate browser vs. app issues.

### AO Message Dispatch Format (RESOLVED)
**Problem**: `TypeError: Cannot read properties of undefined (reading 'map')` when calling wallet dispatch.
**Root Cause**: Incorrect use of wallet's dispatch API; should use aoconnect library instead.
**Solution**: Switched from `window.arweaveWallet.dispatch()` to `@permaweb/aoconnect` with `createDataItemSigner()`.
**Implementation**:
```typescript
import { message, createDataItemSigner } from '@permaweb/aoconnect'

const messageId = await message({
  process: processId,
  tags: messageTags,
  data: data,
  signer: createDataItemSigner(wallet),
})
```

### Arweave Wallet Kit Integration (RESOLVED) 
**Problem**: Multiple strategies causing confusion, incorrect exports.
**Solution**: Simplified to Wander-only strategy, used correct exports from `@arweave-wallet-kit/react`.
**Final Config**:
```typescript
<ArweaveWalletKit
  config={{
    permissions: ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH'],
    ensurePermissions: true,
    strategies: [new WanderStrategy()],
  }}
>
```

### UI Visibility Issues (RESOLVED)
**Problem**: Buttons and text not visible on default styling.
**Solution**: Implemented black background with purple accents for clear visibility.

### Production vs Development Token Economics (CRITICAL DISCOVERY)
**Problem**: Risk of unbacked TIM3 tokens if using test USDA with production TIM3 processes.
**Root Cause**: Production TIM3 processes were being used with mock USDA, creating tokens backed by worthless collateral.
**Solution**: Identified need to integrate production USDA process (FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8) to ensure proper 1:1 backing.
**Lesson**: Economic security requires matching production token processes with production collateral processes.

Scope (Phase 1)
- App scaffolding under `apps/s3arch-gateway` (separate from existing `apps/s3arch`, which contains predictive search work).
- Wallet integration via Wander Connect (with fallback to injected/wallet extension API) for USDA funding and TIM3 token mint UX.
- Minimal UI flow to exercise AO processes (lock/swap), with optional React Three Fiber (r3f) scene for the interactive TIM3 experience (can be gated to a route and loaded lazily).
- Deployment plan using `permaweb-deploy` to Arweave + ArNS update for `s3arch` (and TXT-based Wayfinder on `s3ar.ch` once ready).

References
- AR.IO docs (Gateways, ArNS, Wayfinder, Deploy guide):
  - ArNS overview: https://docs.ar.io/arns
  - Wayfinder protocol: https://docs.ar.io/concepts/wayfinder
  - Permaweb deploy guide: https://docs.ar.io/guides/permaweb-deploy
- Wander Connect docs:
  - https://docs.wander.app/wander-connect/intro
- React Three Fiber (r3f):
  - https://r3f.docs.pmnd.rs/getting-started/introduction
- HyperBEAM (secret/attention infra context):
  - https://github.com/permaweb/HyperBEAM/pull/394

Architecture & Stack
- Framework: React + Vite + TypeScript (align with existing monorepo usage).
- State & Data:
  - Lightweight local state via React state/hooks; requester module for AO interactions.
  - Optional store (Zustand) if/when global state grows (not required initially).
- Wallet: `@wanderapp/connect` primary; leverage `window.arweaveWallet` injected API post-auth for transaction creation/sign.
- 3D/Graphics (optional in Phase 1): `three`, `@react-three/fiber`, `@react-three/drei` for the TIM3 lock/swap scene.
- Styles: start with vanilla CSS or Tailwind; can adopt component library later. Keep initial footprint small.
- Packaging: keep shared AO client types (if needed) under `packages/shared` to avoid duplication.

Project Layout
- `apps/s3arch-gateway/`
  - `src/`
    - `main.tsx`, `App.tsx`
    - `routes/`
      - `Home.tsx` (search/landing)
      - `Tim3.tsx` (lock/swap basic UI)
      - `Tim3Scene.tsx` (r3f scene, lazy-loaded)
    - `wallet/`
      - `WanderProvider.tsx` (boot Wander Connect, events)
      - `useWallet.ts` (connect/disconnect helpers, permissions)
    - `ao/`
      - `client.ts` (HTTP utilities to AO scheduler / process endpoints)
      - `tim3.ts` (lock/swap client calls to TIM3 processes)
    - `analytics/`
      - `attention.ts` (placeholder hook/api for HyperBEAM-compatible pings)
  - `index.html`, `vite.config.ts`, `tsconfig.json`

Wallet Integration (Wander)
- Install: `npm i @wanderapp/connect`
- Initialize early (e.g., `WanderProvider`) with `{ clientId: "FREE_TRIAL" }` (switch to real clientId later).
- Listen for `arweaveWalletLoaded` and, if needed, call `window.arweaveWallet.connect([...permissions])`.
- Recommended initial permissions:
  - `ACCESS_ADDRESS`
  - `SIGN_TRANSACTION`
  - `DISPATCH`
- Use `arweave-js` or a thin signer wrapper for building and signing transactions.
- Docs: https://docs.wander.app/wander-connect/intro

AO/TIM3 Process Integration
- Define endpoints for AO messages (HTTP to AO scheduler / gateway). Use the existing TIM3 process IDs from `apps/tim3/processes.yaml` and scripts as the source of truth.
- Create a small client (`ao/client.ts`) that abstracts:
  - send message → process (e.g., lock, swap commands)
  - query state (e.g., balances, pool status)
- Ensure messages are signed via `window.arweaveWallet` when required (e.g., dispatching user actions) and use public reads for general state.
- Consider arweave gateway GraphQL reads for historical or index data later.

UI/UX Plan
- Phase 1: Minimal screens to:
  - Connect wallet (Wander button, status, address, USDA balance display)
  - Lock: select amount, confirm, dispatch to AO
  - Swap: input amounts, quote (read), confirm, dispatch to AO
  - Show tx/result toasts
- Phase 1.5 (optional): r3f scene in `Tim3Scene.tsx` that mirrors lock/swap interactions with simple mesh interactions; load via code-splitting on route `/tim3/3d`.
- Phase 2: Polish, add animations and deeper 3D interactions; performance guard (feature flag if WebGL unavailable).

HyperBEAM Compatibility (future analytics)
- Target: attention tracking without wallet auth (page pings, route/view events, basic performance beacons).
- From PR #394:
  - Devices like `~auth-hook@1.0`, `~cookie@1.0` and `~http-auth@1.0` enable cookie/session-based signing on trusted nodes.
  - Plan a thin `analytics/attention.ts` that batches page events to a HyperBEAM node endpoint; no wallet required.
  - If node enables `~auth-hook@1.0` with cookie-based secrets, events can be signed server-side for attribution without user friction.
- Defer implementation until after core UI is complete; keep an interface to plug a sender later.
- Reference: https://github.com/permaweb/HyperBEAM/pull/394

ArNS + Wayfinder + Domain Strategy
- App deploys to Arweave; ArNS `s3arch` (ANT pointer) updated to latest manifest TxID (`ar://s3arch`).
- Public domain `s3ar.ch` can use Wayfinder TXT record mode (v0.0.10): set DNS TXT `ARTX <Arweave TXID>` to resolve `ar://s3ar.ch` when Wayfinder is installed.
  - Wayfinder doc: https://docs.ar.io/concepts/wayfinder
- For gateway operation, the app should work behind any AR.IO gateway subdomain as well.
- ArNS details: https://docs.ar.io/arns

Deployment (permaweb-deploy)
- Add devDependency: `permaweb-deploy`.
- Build and deploy script (example):
  - `npm run build && permaweb-deploy --deploy-folder ./dist --arns-name s3arch`
  - For undernames: add `--undername <name>`
- CI/GitHub Actions: add `DEPLOY_KEY` (base64 of wallet.json) secret; ensure Turbo credits loaded and wallet controls the ArNS name.
- Docs: https://docs.ar.io/guides/permaweb-deploy

Phased Milestones & Tasks
1) Scaffold app (React+Vite+TS) under `apps/s3arch-gateway` with clean routing and providers.
2) Integrate Wander Connect (connect/disconnect, address, basic balance read) and basic header UI.
3) Implement AO client wrappers for TIM3 (lock/swap) and wire minimal forms.
4) Smoke test end-to-end on testnet where applicable; adjust permissions/flows.
5) Optional: add r3f route and simple scene that mirrors lock/swap.
6) Add deploy scripts + CI via `permaweb-deploy`; test ArNS update for `s3arch`.
7) Prepare TXT record instruction for `s3ar.ch` (Wayfinder) and/or bind ArNS to undernames if needed.
8) Plan HyperBEAM attention endpoint and client (defer implementation until Phase 1 is stable).

Open Questions / Decisions
- Visual system: Tailwind vs minimal CSS to start? (Recommend minimal now.)
- Do we want a feature flag to disable 3D on low-power devices? (Yes.)
- Exact TIM3 process IDs and expected payload shapes: confirm from `apps/tim3` and integration tests before wiring forms.

Notes
- Keep the initial footprint small; r3f is optional and lazy-loaded to avoid impacting core auth + AO flows.
- Avoid hard-coding a single gateway; use Wayfinder `ar://` links in docs and user-facing copy.
- Ensure no secrets in the static build; double-check before perma deploy.


