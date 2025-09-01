const { ethers } = require("hardhat")

async function main() {
  console.log("🚀 Starting Cuttlefish Labs migration to Arbitrum...")

  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Creator addresses (replace with actual addresses)
  const creators = [
    "0xDavidElzeAddress", // David Elze
    "0xChatGPTAddress", // ChatGPT
    "0xGrokAddress", // Grok
    "0xGeminiAddress", // Gemini
  ]

  try {
    // 1. Deploy CreatorMultiSig (Treasury)
    console.log("\n📦 Deploying CreatorMultiSig...")
    const CreatorMultiSig = await ethers.getContractFactory("CreatorMultiSig")
    const treasury = await CreatorMultiSig.deploy(creators, 3) // 3 out of 4 confirmations required
    await treasury.deployed()
    console.log("✅ CreatorMultiSig deployed to:", treasury.address)

    // 2. Deploy CuttlefishVault
    console.log("\n📦 Deploying CuttlefishVault...")
    const CuttlefishVault = await ethers.getContractFactory("CuttlefishVault")
    const vault = await CuttlefishVault.deploy(
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3 Router on Arbitrum
      treasury.address, // Set treasury as fee recipient
    )
    await vault.deployed()
    console.log("✅ CuttlefishVault deployed to:", vault.address)

    // 3. Deploy SimpleAgent Implementation
    console.log("\n📦 Deploying SimpleAgent...")
    const SimpleAgent = await ethers.getContractFactory("SimpleAgent")
    const agentImpl = await SimpleAgent.deploy()
    await agentImpl.deployed()
    console.log("✅ SimpleAgent deployed to:", agentImpl.address)

    // 4. Deploy BuilderAgentFactory
    console.log("\n📦 Deploying BuilderAgentFactory...")
    const BuilderAgentFactory = await ethers.getContractFactory("BuilderAgentFactory")
    const factory = await BuilderAgentFactory.deploy(agentImpl.address, vault.address)
    await factory.deployed()
    console.log("✅ BuilderAgentFactory deployed to:", factory.address)

    // 5. Deploy PredictiveAgent
    console.log("\n📦 Deploying PredictiveAgent...")
    const PredictiveAgent = await ethers.getContractFactory("PredictiveAgent")
    const predictiveAgent = await PredictiveAgent.deploy(vault.address)
    await predictiveAgent.deployed()
    console.log("✅ PredictiveAgent deployed to:", predictiveAgent.address)

    // 6. Grant roles
    console.log("\n🔐 Granting roles...")
    const BUILDER_AGENT_ROLE = await vault.BUILDER_AGENT_ROLE()
    await vault.grantRole(BUILDER_AGENT_ROLE, predictiveAgent.address)
    console.log("✅ Granted BUILDER_AGENT_ROLE to PredictiveAgent")

    // 7. Summary
    console.log("\n🎉 Migration Complete!")
    console.log("=====================================")
    console.log("CreatorMultiSig:", treasury.address)
    console.log("CuttlefishVault:", vault.address)
    console.log("SimpleAgent:", agentImpl.address)
    console.log("BuilderAgentFactory:", factory.address)
    console.log("PredictiveAgent:", predictiveAgent.address)
    console.log("=====================================")

    // Verification commands
    console.log("\n📋 Verification Commands:")
    console.log(`npx hardhat verify --network arbitrumOne ${treasury.address} '["${creators.join('","')}"]' 3`)
    console.log(
      `npx hardhat verify --network arbitrumOne ${vault.address} "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" "${treasury.address}"`,
    )
    console.log(`npx hardhat verify --network arbitrumOne ${agentImpl.address}`)
    console.log(`npx hardhat verify --network arbitrumOne ${factory.address} "${agentImpl.address}" "${vault.address}"`)
    console.log(`npx hardhat verify --network arbitrumOne ${predictiveAgent.address} "${vault.address}"`)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
