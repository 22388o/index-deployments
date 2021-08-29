import { BigNumber } from "@ethersproject/bignumber";
import { ether } from "@utils/index";
import { EMPTY_BYTES, ONE_DAY_IN_SECONDS } from "@deployments/utils/constants";

export const CONTRACT_NAMES = {
  BASE_MANAGER: "BaseManagerV2",
  BASE_MANAGER_NAME: "LINKFLIBaseManager",
  STANDARD_TOKEN_MOCK: "StandardTokenMock",
  LEVERAGE_EXTENSION: "AaveLeverageStrategyExtension",
  LEVERAGE_EXTENSION_NAME: "LINKAaveLeverageStrategyExtension",
  FEE_SPLIT_ADAPTER: "FeeSplitExtension",
  FEE_SPLIT_ADAPTER_NAME: "LINKFLIFeeSplitAdapter",
  SUPPLY_CAP_ISSUANCE_HOOK: "SupplyCapAllowedCallerIssuanceHook",
  SUPPLY_CAP_ISSUANCE_HOOK_NAME: "LINKFLISupplyCapAllowedCallerIssuanceHook",
  UNISWAP_V3_EXCHANGE_ADAPTER: "UniswapV3ExchangeAdapter",
  AMM_SPLITTER_EXCHANGE_ADAPTER: "AMMSplitterExchangeAdapter",
  FLI_VIEWER: "FLIRebalanceViewer",
  FLI_VIEWER_NAME: "LINKFLIRebalanceViewer",
};


export const CONTRACT_SETTINGS = {
  COLLATERAL_DECIMAL_ADJUSTMENT: BigNumber.from(10),      // Decimal adjustment for chainlink Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
  BORROW_DECIMAL_ADJUSTMENT: BigNumber.from(22),          // Decimal adjustment for chainlink. Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
};

export const FEE_SPLIT_ADAPTER = {
  FEE_SPLIT: ether(.6),                                   // 60% operator, 40% methodologist fee split
};

export const SUPPLY_CAP_ISSUANCE_HOOK = {
  SUPPLY_CAP: ether(200000),                               // At $100 LINK FLI supply cap is $20M
};

export const METHODOLOGY_SETTINGS = {
  targetLeverageRatio: ether(2),                          // 2x
  minLeverageRatio: ether(1.8),                           // 1.8x
  maxLeverageRatio: ether(2.2),                           // 2.2x
  recenteringSpeed: ether(0.1),                           // 5% recentering speed
  rebalanceInterval: ONE_DAY_IN_SECONDS,                  // 1 day rebalance interval
};

export const EXECUTION_SETTINGS = {
  unutilizedLeveragePercentage: ether(0.01),               // 1% of leverage as buffer from max borrow
  twapCooldownPeriod: BigNumber.from(30),                  // 30 sec cooldown
  slippageTolerance: ether(0.02),                          // 2% max slippage on regular rebalances
};

export const INCENTIVE_SETTINGS = {
  incentivizedTwapCooldownPeriod: BigNumber.from(1),      // 1 sec cooldown on ripcord
  incentivizedSlippageTolerance: ether(0.05),             // 5% max slippage on ripcord
  etherReward: ether(1.5),                                // 2000 gwei * 700k gas used = 1.4 ETH
  incentivizedLeverageRatio: ether(2.4),
};

export const EXCHANGE_NAMES = [
  "AMMSplitterExchangeAdapter",
  "UniswapV3ExchangeAdapter",
];

export const EXCHANGE_SETTINGS = [
  {
    twapMaxTradeSize: ether(1000),                        // 1000 LINK max trade size
    incentivizedTwapMaxTradeSize: ether(2000),            // 2000 LINK max trade size on ripcord
    exchangeLastTradeTimestamp: ether(0),
    leverExchangeData: EMPTY_BYTES,                       // will be overridden in deployment script
    deleverExchangeData: EMPTY_BYTES,                     // will be overridden in deployment script
  },
  {
    twapMaxTradeSize: ether(5000),                        // 5000 LINK max trade size
    incentivizedTwapMaxTradeSize: ether(10000),           // 10000 LINK max trade size
    exchangeLastTradeTimestamp: ether(0),
    leverExchangeData: EMPTY_BYTES,                       // will be overridden in deploy script
    deleverExchangeData: EMPTY_BYTES,                     // will be overridden in deploy script
  },
];