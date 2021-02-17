
export default {
  // TOKENS

  DPI: {
    1: "0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b",
    42: "0xEA41F11c916813EDa966a4e1a0b09c98C4bbC555",
  },
  DPI_ETH_UNI_POOL: {
    1: "0x4d5ef58aac27d99935e5b6b4a6778ff292059991",
    42: "0x64cf6e538ce757645a953376c0f1be6fab8a2e09",
  },
  WETH: {
    1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    42: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  },
  USDC: {
    1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    42: "0x15758350DECEA0E5A96cFe9024e3f352d039905a",
  },
  ETHFLI: {
    1: "",
    42: "",
  },

  // Set Protocol Contracts
  COMPOUND_LEVERAGE_MODULE: {
    1: "",
    42: "",
  },
  STREAMING_FEE_MODULE: {
    1: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
    42: "0xE038E59DEEC8657d105B6a3Fb5040b3a6189Dd51",
  },
  SINGLE_INDEX_MODULE: {
    1: "0x25100726b25a6ddb8f8e68988272e1883733966e",
    42: "0x8398f4710d35c8f15a7e4eced3e7b6a0e909d019",
  },

  // Compound Contracts
  C_ETH: {
    1: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",
    42: "0xefa3e50f493d39a1b53698c549ad35fbf4b1053c",
  },
  C_USDC: {
    1: "0x39aa39c021dfbae8fac545936693ac917d5e7563",
    42: "0x48f4944f65c1d67009b6d5c9f70bd79c2f41ead8",
  },
  COMPOUND_COMPTROLLER: {
    1: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    42: "0x047ba8fe92c01bffec22a93b3acdfc9a938887f9", // This is a mock Comptroller deployment
  },
  COMPOUND_PRICE_ORACLE: {
    1: "0x922018674c12a7f0d394ebeef9b58f186cde13c1",
    42: "0x160ac3bbbd338bef846dc04ac3d2a9be8de955b1", // This is a mock PriceOracle deployment
  },

  // Admin
  TREASURY_MULTI_SIG: {
    1: "0x9467cfADC9DE245010dF95Ec6a585A506A8ad5FC",
  },
  SET_LABS: {
    1: "0xF8523c551763FE4261A28313015267F163de7541",
  },
  DFP_MULTI_SIG: {
    1: "0x673d140Eed36385cb784e279f8759f495C97cF03",
  },
  HUMAN_FRIENDLY_NAMES: {
    1: "main-net",
    42: "kovan",
    50: "test-rpc",
  },
} as any;

export const DEPENDENCY = {
  // Tokens
  DPI: "DPI",
  DPI_ETH_UNI_POOL: "DPI_ETH_UNI_POOL",
  ETHFLI: "ETHFLI",
  WETH: "WETH",
  USDC: "USDC",
  // Set Protocol Contracts
  C_ETH: "C_ETH",
  C_USDC: "C_USDC",
  COMPOUND_LEVERAGE_MODULE: "COMPOUND_LEVERAGE_MODULE",
  SINGLE_INDEX_MODULE: "SINGLE_INDEX_MODULE",
  STREAMING_FEE_MODULE: "STREAMING_FEE_MODULE",
  // Compound Contracts
  COMPOUND_COMPTROLLER: "COMPOUND_COMPTROLLER",
  COMPOUND_PRICE_ORACLE: "COMPOUND_PRICE_ORACLE",
  // Admin
  TREASURY_MULTI_SIG: "TREASURY_MULTI_SIG",
  DFP_MULTI_SIG: "DFP_MULTI_SIG",
  SET_LABS: "SET_LABS",
};