import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { vars } = require("hardhat/config");
const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const PRIVATE_SEPOLIA_KEY = vars.get("PRIVATE_SEPOLIA_KEY");
const PRIVATE_COINMARKETCAP_KEY = vars.get("PRIVATE_COINMARKETCAP_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: PRIVATE_COINMARKETCAP_KEY,
    gasPriceApi:
      "https://api-sepolia.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_SEPOLIA_KEY],
      timeout: 60000,
    },
  },
};

export default config;
