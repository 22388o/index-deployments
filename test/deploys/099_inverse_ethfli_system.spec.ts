import "module-alias/register";
import { deployments } from "hardhat";
import { solidityPack } from "ethers/lib/utils";

import { Account } from "@utils/types";
import {
  BaseManager,
  FeeSplitAdapter,
  SupplyCapAllowedCallerIssuanceHook,
  FlexibleLeverageStrategyExtension,
  BaseManager__factory,
  FeeSplitAdapter__factory,
  SupplyCapAllowedCallerIssuanceHook__factory,
  FlexibleLeverageStrategyExtension__factory,
} from "@set/typechain/index";

import { BigNumber } from "@ethersproject/bignumber";
import {
  addSnapshotBeforeRestoreAfterEach,
  ether,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";
import {
  findDependency,
  getContractAddress,
  ONE_DAY_IN_SECONDS,
  EMPTY_BYTES
} from "@deployments/utils";
import { CONTRACT_SETTINGS } from "@deployments/constants/099_inverse_ethfli_system";

const expect = getWaffleExpect();

describe.only("InverseETHFLI System", () => {
  let deployer: Account;

  let baseManagerInstance: BaseManager;
  let flexibleLeverageStrategyExtensionInstance: FlexibleLeverageStrategyExtension;
  let feeSplitAdapterInstance: FeeSplitAdapter;
  let supplyCapInstance: SupplyCapAllowedCallerIssuanceHook;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedBaseManagerContract = await getContractAddress("InverseETHFLIBaseManager");
    baseManagerInstance = new BaseManager__factory(deployer.wallet).attach(deployedBaseManagerContract);

    const deployedFlexibleLeverageStrategyExtensionContract = await getContractAddress("InverseETHFlexibleLeverageStrategyExtension");
    flexibleLeverageStrategyExtensionInstance =
      new FlexibleLeverageStrategyExtension__factory(deployer.wallet).attach(deployedFlexibleLeverageStrategyExtensionContract);

    const deployedFeeSplitAdapterContract = await getContractAddress("InverseETHFLIFeeSplitAdapter");
    feeSplitAdapterInstance = new FeeSplitAdapter__factory(deployer.wallet).attach(deployedFeeSplitAdapterContract);

    const deployedSupplyCapAllowedCallerIssuanceHookContract = await getContractAddress("InverseETHFLISupplyCapAllowedCallerIssuanceHook");
    supplyCapInstance = new SupplyCapAllowedCallerIssuanceHook__factory(deployer.wallet).attach(deployedSupplyCapAllowedCallerIssuanceHookContract);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("BaseManager", async () => {
    it("should have the correct SetToken address", async () => {
      const setToken = await baseManagerInstance.setToken();
      expect(setToken).to.eq(await findDependency("I_ETHFLI"));
    });

    it("should have the correct operator address", async () => {
      const operator = await baseManagerInstance.operator();
      expect(operator).to.eq(deployer.address);
    });

    it("should have the correct methodologist address", async () => {
      const methodologist = await baseManagerInstance.methodologist();
      expect(methodologist).to.eq(deployer.address);
    });

    it("should have the correct adapters", async () => {
      const adapters = await baseManagerInstance.getAdapters();
      expect(adapters[0]).to.eq(flexibleLeverageStrategyExtensionInstance.address);
      expect(adapters[1]).to.eq(feeSplitAdapterInstance.address);
    });
  });

  describe("FlexibleLeverageStrategyExtension", async () => {
    it("should set the manager", async () => {
      const manager = await flexibleLeverageStrategyExtensionInstance.manager();

      expect(manager).to.eq(baseManagerInstance.address);
    });

    it("should set the contract addresses", async () => {
      const strategy = await flexibleLeverageStrategyExtensionInstance.getStrategy();

      expect(strategy.setToken).to.eq(await findDependency("I_ETHFLI"));
      expect(strategy.leverageModule).to.eq(await findDependency("COMPOUND_LEVERAGE_MODULE"));
      expect(strategy.comptroller).to.eq(await findDependency("COMPOUND_COMPTROLLER"));
      expect(strategy.targetCollateralCToken).to.eq(await findDependency("C_USDC"));
      expect(strategy.targetBorrowCToken).to.eq(await findDependency("C_ETH"));
      expect(strategy.collateralAsset).to.eq(await findDependency("USDC"));
      expect(strategy.borrowAsset).to.eq(await findDependency("WETH"));
      expect(strategy.collateralPriceOracle).to.eq(await findDependency("CHAINLINK_USDC"));
      expect(strategy.borrowPriceOracle).to.eq(await findDependency("CHAINLINK_ETH"));
      expect(strategy.collateralDecimalAdjustment).to.eq(CONTRACT_SETTINGS.COLLATERAL_DECIMAL_ADJUSTMENT);
      expect(strategy.borrowDecimalAdjustment).to.eq(CONTRACT_SETTINGS.BORROW_DECIMAL_ADJUSTMENT);
    });

    it("should set the correct methodology parameters", async () => {
      const methodology = await flexibleLeverageStrategyExtensionInstance.getMethodology();

      expect(methodology.targetLeverageRatio).to.eq(ether(2));
      expect(methodology.minLeverageRatio).to.eq(ether(1.85));
      expect(methodology.maxLeverageRatio).to.eq(ether(2.15));
      expect(methodology.recenteringSpeed).to.eq(ether(0.05));
      expect(methodology.rebalanceInterval).to.eq(ONE_DAY_IN_SECONDS);
    });

    it("should set the correct execution parameters", async () => {
      const execution = await flexibleLeverageStrategyExtensionInstance.getExecution();

      expect(execution.unutilizedLeveragePercentage).to.eq(ether(0.01));
      expect(execution.twapCooldownPeriod).to.eq(BigNumber.from(30));
      expect(execution.slippageTolerance).to.eq(ether(0.02));
    });

    it("should set the correct incentive parameters", async () => {
      const incentive = await flexibleLeverageStrategyExtensionInstance.getIncentive();

      expect(incentive.incentivizedTwapCooldownPeriod).to.eq(BigNumber.from(1));
      expect(incentive.incentivizedSlippageTolerance).to.eq(ether(0.05));
      expect(incentive.etherReward).to.eq(ether(1.5));
      expect(incentive.incentivizedLeverageRatio).to.eq(ether(2.7));
    });

    it("should set the correct exchange settings", async () => {
      const sushiSettings = await flexibleLeverageStrategyExtensionInstance.getExchangeSettings("SushiswapExchangeAdapter");
      const uniV3Settings = await flexibleLeverageStrategyExtensionInstance.getExchangeSettings("UniswapV3ExchangeAdapter");
      const ammSplitterSettings = await flexibleLeverageStrategyExtensionInstance.getExchangeSettings("AMMSplitterExchangeAdapter");

      const uniV3LeverData = solidityPack(
        ["address", "uint24", "address"],
        [await findDependency("WETH"), BigNumber.from(3000), await findDependency("USDC")]
      );
      const uniV3DeleverData = solidityPack(
        ["address", "uint24", "address"],
        [await findDependency("USDC"), BigNumber.from(3000), await findDependency("WETH")]
      );

      expect(sushiSettings.twapMaxTradeSize).to.eq(ether(600));
      expect(sushiSettings.incentivizedTwapMaxTradeSize).to.eq(ether(1600));
      expect(sushiSettings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(sushiSettings.leverExchangeData).to.eq(EMPTY_BYTES);
      expect(sushiSettings.deleverExchangeData).to.eq(EMPTY_BYTES);

      expect(ammSplitterSettings.twapMaxTradeSize).to.eq(ether(1200));
      expect(ammSplitterSettings.incentivizedTwapMaxTradeSize).to.eq(ether(3000));
      expect(ammSplitterSettings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(ammSplitterSettings.leverExchangeData).to.eq(EMPTY_BYTES);
      expect(ammSplitterSettings.deleverExchangeData).to.eq(EMPTY_BYTES);

      expect(uniV3Settings.twapMaxTradeSize).to.eq(ether(2000));
      expect(uniV3Settings.incentivizedTwapMaxTradeSize).to.eq(ether(3000));
      expect(uniV3Settings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(uniV3Settings.leverExchangeData).to.eq(uniV3LeverData);
      expect(uniV3Settings.deleverExchangeData).to.eq(uniV3DeleverData);
    });

    it("should set the correct enabled exchanges", async () => {
      const enabledExchanges = await flexibleLeverageStrategyExtensionInstance.getEnabledExchanges();

      expect(enabledExchanges.length).to.eq(3);
      expect(enabledExchanges[0]).to.eq("SushiswapExchangeAdapter");
      expect(enabledExchanges[1]).to.eq("UniswapV3ExchangeAdapter");
      expect(enabledExchanges[2]).to.eq("AMMSplitterExchangeAdapter");
    });
  });

  describe("FeeSplitAdapter", async () => {
    it("should set the correct addresses", async () => {
      const manager = await feeSplitAdapterInstance.manager();
      const streamingFeeModule = await feeSplitAdapterInstance.streamingFeeModule();
      const issuanceModule = await feeSplitAdapterInstance.issuanceModule();
      const operatorFeeSplit = await feeSplitAdapterInstance.operatorFeeSplit();

      expect(manager).to.eq(baseManagerInstance.address);
      expect(streamingFeeModule).to.eq(await findDependency("STREAMING_FEE_MODULE"));
      expect(issuanceModule).to.eq(await findDependency("DEBT_ISSUANCE_MODULE"));
      expect(operatorFeeSplit).to.eq(ether(0.6));
    });
  });

  describe("SupplyCapAllowedCallerIssuanceHook", async () => {
    it("should set the correct owner", async () => {
      const owner = await supplyCapInstance.owner();

      expect(owner).to.eq(deployer.address);
    });

    it("should set the correct supply cap", async () => {
      const supplyCap = await supplyCapInstance.supplyCap();

      expect(supplyCap).to.eq(ether(1000000));
    });
  });
});