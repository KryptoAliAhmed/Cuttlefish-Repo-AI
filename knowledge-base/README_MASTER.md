
# Cuttlefish Master Core - July 2025

This repository consolidates all major Cuttlefish Labs systems into a single canonical stack.

## Structure
- `DigitalTwin/`: Earth2 MapBuilder for opportunity zones, distressed overlays, IPFS + TrustGraph.
- `BuilderFactory/`: Multi-agent backend (docker-compose), planners, architects, milestone memory.
- `Dashboard/`: Tailwind + React dashboards with CI/CD telemetry & investor views.
- `DAO/`: Solidity smart contracts for E2RToken, GoldenNFT, CarbonVault, with deploy scripts.
- `CI_CD/`: GitHub Actions workflows and Docker deployment files.
- `Assets/TributaryPhotos/`: Latest due diligence photos for the Alabama site.

## Install & Run
- `docker-compose up` in BuilderFactory/
- `npm install && npm run dev` in Dashboard/
- `python deploy.py` in DAO/ to push contracts
- `terraform apply` in DigitalTwin/ for infra overlays

---
Powered by Cuttlefish Labs | Earth 2.0 | Sovereign AI | Carbon-Negative DAO Governance
