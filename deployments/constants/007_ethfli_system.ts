import { BigNumber } from "@ethersproject/bignumber";
import { ether } from "@utils/index";
import { EMPTY_BYTES, ONE_DAY_IN_SECONDS } from "@deployments/utils/constants";

export const CONTRACT_NAMES = {
  BASE_MANAGER: "BaseManager",
  FLEXIBLE_LEVERAGE_EXTENSION: "FlexibleLeverageStrategyExtension",
  STANDARD_TOKEN_MOCK: "StandardTokenMock",
  FEE_SPLIT_ADAPTER: "FeeSplitAdapter",
  SUPPLY_CAP_ISSUANCE_HOOK: "SupplyCapIssuanceHook",
};

export const CONTRACT_SETTINGS = {
  COLLATERAL_DECIMAL_ADJUSTMENT: BigNumber.from(10),      // Decimal adjustment for chainlink. Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
  BORROW_DECIMAL_ADJUSTMENT: BigNumber.from(22),          // Decimal adjustment for chainlink. Equal to 28-decimals (10^18 * 10^18 / 10^dec / 10^8)
};

export const FEE_SPLIT_ADAPTER = {
  FEE_SPLIT: ether(.6),                                   // 60% operator, 40% methodologist fee split
};

export const SUPPLY_CAP_ISSUANCE_HOOK = {
  SUPPLY_CAP: ether(50000),                               // At $100 ETHFLI supply cap is $5M
};

export const METHODOLOGY_SETTINGS = {
  targetLeverageRatio: ether(2),                          // 2x according to ETHFLI proposal
  minLeverageRatio: ether(1.7),                           // 1.7x according to FLI proposal
  maxLeverageRatio: ether(2.3),                           // 2.3x according to FLI proposal
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
];

export const EXCHANGE_SETTINGS = [
  {
    twapMaxTradeSize: ether(600),                         // 600 ETH max trade size ~0.6% price impact
    exchangeLastTradeTimestamp: ether(0),
    incentivizedTwapMaxTradeSize: ether(1600),            // 1600 ETH max trade size ~1.2% price impact on ripcord
    leverExchangeData: EMPTY_BYTES,
    deleverExchangeData: EMPTY_BYTES,
  },
  {
    twapMaxTradeSize: ether(2000),                        // 2000 ETH max trade size ~.67% price impact
    exchangeLastTradeTimestamp: ether(0),
    incentivizedTwapMaxTradeSize: ether(3000),            // 3000 ETH max trade size ~1% price impact on ripcord
    leverExchangeData: EMPTY_BYTES,                       // will be overridden in deploy script
    deleverExchangeData: EMPTY_BYTES,                     // will be overridden in deploy script
  },
];