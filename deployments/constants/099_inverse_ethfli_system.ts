import { BigNumber } from "@ethersproject/bignumber";
import { ether } from "@utils/index";
import { EMPTY_BYTES, ONE_DAY_IN_SECONDS } from "@deployments/utils/constants";

export const CONTRACT_NAMES = {
  BASE_MANAGER: "BaseManager",
  BASE_MANAGER_NAME: "InverseETHFLIBaseManager",
  FLEXIBLE_LEVERAGE_EXTENSION: "FlexibleLeverageStrategyExtension",
  FLEXIBLE_LEVERAGE_EXTENSION_NAME: "InverseETHFlexibleLeverageStrategyExtension",
  STANDARD_TOKEN_MOCK: "StandardTokenMock",
  FEE_SPLIT_ADAPTER: "FeeSplitAdapter",
  FEE_SPLIT_ADAPTER_NAME: "InverseETHFLIFeeSplitAdapter",
  SUPPLY_CAP_ISSUANCE_HOOK: "SupplyCapAllowedCallerIssuanceHook",
  SUPPLY_CAP_ISSUANCE_HOOK_NAME: "InverseETHFLISupplyCapAllowedCallerIssuanceHook",
};

export const CONTRACT_SETTINGS = {
  COLLATERAL_DECIMAL_ADJUSTMENT: BigNumber.from(22), // USDC decimal adjustment for chainlink. Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
  BORROW_DECIMAL_ADJUSTMENT: BigNumber.from(10),     // ETH decimal adjustment for chainlink. Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
};

export const FEE_SPLIT_ADAPTER = {
  FEE_SPLIT: ether(.6),                                   // 60% operator, 40% methodologist fee split
};

export const SUPPLY_CAP_ISSUANCE_HOOK = {
  SUPPLY_CAP: ether(1000000),                             // PLACEHOLDER
};

export const METHODOLOGY_SETTINGS = {
  targetLeverageRatio: ether(2),                          // 2x according to inverse ETHFLI proposal
  minLeverageRatio: ether(1.85),                          // PLACEHOLDER
  maxLeverageRatio: ether(2.15),                          // PLACEHOLDER
  recenteringSpeed: ether(0.05),                          // 5% recentering speed according to FLI proposal
  rebalanceInterval: ONE_DAY_IN_SECONDS,                  // 1 day rebalance interval
};

export const EXECUTION_SETTINGS = {
  unutilizedLeveragePercentage: ether(0.01),              // 1% of leverage as buffer from max borrow
  twapCooldownPeriod: BigNumber.from(30),                 // 30 sec cooldown
  slippageTolerance: ether(0.02),                         // 2% max slippage on regular rebalances
};

export const INCENTIVE_SETTINGS = {
  incentivizedTwapCooldownPeriod: BigNumber.from(1),      // 1 sec cooldown on ripcord
  incentivizedSlippageTolerance: ether(0.05),             // 5% max slippage on ripcord
  etherReward: ether(1.5),                                // 2000 gwei * 700k gas used = 1.4 ETH
  incentivizedLeverageRatio: ether(2.7),                  // 1 ripcord will return back to 2.3x
};

export const EXCHANGE_NAMES = [
  "SushiswapExchangeAdapter",
  "UniswapV3ExchangeAdapter",
  "AMMSplitterExchangeAdapter",
];

export const EXCHANGE_SETTINGS = [
  {
    twapMaxTradeSize: ether(600),                         // PLACEHOLDER
    exchangeLastTradeTimestamp: ether(0),
    incentivizedTwapMaxTradeSize: ether(1600),            // PLACEHOLDER
    leverExchangeData: EMPTY_BYTES,
    deleverExchangeData: EMPTY_BYTES,
  },
  {
    twapMaxTradeSize: ether(2000),                        // PLACEHOLDER
    exchangeLastTradeTimestamp: ether(0),
    incentivizedTwapMaxTradeSize: ether(3000),            // PLACEHOLDER
    leverExchangeData: EMPTY_BYTES,                       // will be overridden in deploy script
    deleverExchangeData: EMPTY_BYTES,                     // will be overridden in deploy script
  },
  {
    twapMaxTradeSize: ether(1200),                        // PLACEHOLDER
    exchangeLastTradeTimestamp: ether(0),
    incentivizedTwapMaxTradeSize: ether(3000),            // PLACEHOLDER
    leverExchangeData: EMPTY_BYTES,                       // will be overridden in deploy script
    deleverExchangeData: EMPTY_BYTES,                     // will be overridden in deploy script
  },
];