# S3ARCH Gateway – USDA → TIM3 Deposit Flow (Coordinator v2)

This frontend is a thin client: wallets connect and send AO messages; all swap logic runs in AO (deterministic). For v1, deposits go to the Coordinator (acts as custody); TIM3 is minted 1:1 on USDA Credit-Notice.

## Deposit Flow (Astro-aligned, AO-only)

1. User sends USDA transfer:
   - `Action: Transfer`
   - Tags: `Recipient=<CoordinatorPID>`, `Quantity=<amount>`
2. USDA emits to Coordinator:
   - `Action: Credit-Notice`
   - Tags: includes `Sender`, `Quantity`
3. Coordinator mints TIM3:
   - `Action: Mint`
   - Tags: `Recipient=<Sender>`, `Amount=<Quantity>`

UI responsibilities:
- Connect Wander wallet
- Send `Transfer` to USDA PID with `Recipient` set to Coordinator PID
- Display balances via `Balance` queries

Production PIDs (confirmed in repo):
- Coordinator: `dxkd6zkK2t5k0fv_-eG3WRTtZaExetLV0410xI6jfsw`
- Token Manager: `BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0`
- State Manager: `K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4`
- USDA (real): `FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8`

## ENV selection
Set `ENVIRONMENT` in `src/ao/processes.ts` to `'production'` for live PIDs.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

## TIM3 Token Display and Redemption (Atomic Contract)

- Decimals: Display TIM3 and USDA with 6 decimals. The atomic contract and Mock USDA both use 6, which keeps 1:1 math exact and avoids scaling.
- Ticker: Use "TIM3" for the user token. Any coordinator labels (e.g., "TIM3-COORD") are legacy/advanced metadata.
- Partial Redemption (Burn): Users can burn any portion of their TIM3 to receive USDA back 1:1. UX should:
  - Offer a "Redeem" action that sends `Transfer` with `Recipient=burn, Quantity=<amount>` to the TIM3 process.
  - Show post‑redeem balances using the same 6‑decimal display for consistency.
- Health/Stats: The atomic process reports `TotalSupply`, `UsdaCollateral`, `CollateralRatio`, and swap/burn counts. A balanced system maintains `CollateralRatio = 1`.

Notes
- Testing should prefer the atomic flow (Node + aoconnect) and Mock USDA for safety.
- Coordinator scenarios remain available but are labeled legacy/advanced and may require json preloads on target nodes.

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
