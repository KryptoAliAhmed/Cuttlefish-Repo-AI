# 🐙 Builder AI Agent v0.5.0 - Advanced DAO & Persistence

## Cuttlefish Labs v0 Peer Evaluation Framework

**Purpose**: An interactive web application for simulating autonomous builder agents. This version introduces a significantly upgraded **DAO** with persistence, a detailed changelog, and robust error handling, making the governance layer more resilient and transparent.

### Key Features

-   **Advanced DAO**: The governance module now includes custom errors, voter tracking, and a detailed changelog for all proposals and resolutions.
-   **State Persistence**: DAO state is now saved using a new persistence layer. In the browser, this uses `localStorage`. In Node.js, it saves to a `data/` directory.
-   **Interactive React UI**: Propose experiments, attest to results, and manage agents directly from your browser.
-   **AI Orchestrator (LangChain)**: A high-level controller that interprets natural language tasks and delegates them to the appropriate agents.
-   **Full TypeScript Stack**: The entire codebase, including the React UI, is strongly typed.

### 🚀 How to Run

#### 1. Setup Environment

The AI Orchestrator requires an OpenAI API key.

-   Create a file named `.env` in the root of the `repos/builder-ai-agent` directory.
-   Add your OpenAI API key to it like this:

\`\`\`
VITE_OPENAI_API_KEY=sk-YourSecretApiKey
\`\`\`

#### 2. Install Dependencies

Navigate to the agent directory and install the required packages:

\`\`\`bash
cd repos/builder-ai-agent
npm install
\`\`\`

#### 3. Run the Development Server

Start the Vite development server:

\`\`\`bash
npm run dev
\`\`\`

This will open the interactive simulator in your browser. You can now use the forms to have the agents perform tasks.

### Command-Line Simulation

You can still run a non-interactive simulation in your terminal. Make sure your `.env` file is set up as described above, but use `OPENAI_API_KEY` instead of `VITE_OPENAI_API_KEY`.

\`\`\`bash
npm run test:sim
\`\`\`

### Project Structure

-   `src/`: Core TypeScript source files.
    -   `components/`: React components for the UI.
    -   `Agent.ts`, `DAO.ts`, `Orchestrator.ts`: Core logic for the simulation.
    -   `persistence.ts`: Handles saving state to localStorage or the filesystem.
-   `simulations/`: Standalone test scenarios for Node.js.
-   `index.html`: Entry point for the Vite application.
-   `vite.config.ts`: Vite build configuration.
