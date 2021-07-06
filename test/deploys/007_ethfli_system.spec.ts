import "module-alias/register";
import { deployments } from "hardhat";

import { Account } from "@utils/types";
import {
  BaseManager,
  FeeSplitAdapter,
  SupplyCapIssuanceHook,
  FlexibleLeverageStrategyExtension,
  BaseManager__factory,
  FeeSplitAdapter__factory,
  SupplyCapIssuanceHook__factory,
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
  EMPTY_BYTES,
} from "@deployments/utils";
import { CONTRACT_SETTINGS } from "@deployments/constants/007_ethfli_system";
import { solidityPack } from "ethers/lib/utils";

const expect = getWaffleExpect();

describe("ETHFLI System", () => {
  let deployer: Account;

  let baseManagerInstance: BaseManager;
  let flexibleLeverageStrategyExtensionInstance: FlexibleLeverageStrategyExtension;
  let feeSplitAdapterInstance: FeeSplitAdapter;
  let supplyCapInstance: SupplyCapIssuanceHook;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedBaseManagerContract = await getContractAddress("BaseManager");
    baseManagerInstance = new BaseManager__factory(deployer.wallet).attach(deployedBaseManagerContract);

    const deployedFlexibleLeverageStrategyAdapterContract = await getContractAddress("FlexibleLeverageStrategyExtension");
    flexibleLeverageStrategyExtensionInstance =
      new FlexibleLeverageStrategyExtension__factory(deployer.wallet).attach(deployedFlexibleLeverageStrategyAdapterContract);

    const deployedFeeSplitAdapterContract = await getContractAddress("FeeSplitAdapter");
    feeSplitAdapterInstance = new FeeSplitAdapter__factory(deployer.wallet).attach(deployedFeeSplitAdapterContract);

    const deployedSupplyCapIssuanceHookContract = await getContractAddress("SupplyCapIssuanceHook");
    supplyCapInstance = new SupplyCapIssuanceHook__factory(deployer.wallet).attach(deployedSupplyCapIssuanceHookContract);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("BaseManager", async () => {
    it("should have the correct SetToken address", async () => {
      const setToken = await baseManagerInstance.setToken();
      expect(setToken).to.eq(await findDependency("ETHFLI"));
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

      expect(strategy.setToken).to.eq(await findDependency("ETHFLI"));
      expect(strategy.leverageModule).to.eq(await findDependency("COMPOUND_LEVERAGE_MODULE"));
      expect(strategy.comptroller).to.eq(await findDependency("COMPOUND_COMPTROLLER"));
      expect(strategy.targetCollateralCToken).to.eq(await findDependency("C_ETH"));
      expect(strategy.targetBorrowCToken).to.eq(await findDependency("C_USDC"));
      expect(strategy.collateralAsset).to.eq(await findDependency("WETH"));
      expect(strategy.borrowAsset).to.eq(await findDependency("USDC"));
      expect(strategy.collateralPriceOracle).to.eq(await findDependency("CHAINLINK_ETH"));
      expect(strategy.borrowPriceOracle).to.eq(await findDependency("CHAINLINK_USDC"));
      expect(strategy.collateralDecimalAdjustment).to.eq(CONTRACT_SETTINGS.COLLATERAL_DECIMAL_ADJUSTMENT);
      expect(strategy.borrowDecimalAdjustment).to.eq(CONTRACT_SETTINGS.BORROW_DECIMAL_ADJUSTMENT);
    });

    it("should set the correct methodology parameters", async () => {
      const methodology = await flexibleLeverageStrategyExtensionInstance.getMethodology();

      expect(methodology.targetLeverageRatio).to.eq(ether(2));
      expect(methodology.minLeverageRatio).to.eq(ether(1.7));
      expect(methodology.maxLeverageRatio).to.eq(ether(2.3));
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

      const uniV3LeverData = solidityPack(
        ["address", "uint24", "address"],
        [await findDependency("USDC"), BigNumber.from(3000), await findDependency("WETH")]
      );
      const uniV3DeleverData = solidityPack(
        ["address", "uint24", "address"],
        [await findDependency("WETH"), BigNumber.from(3000), await findDependency("USDC")]
      );

      expect(sushiSettings.twapMaxTradeSize).to.eq(ether(600));
      expect(sushiSettings.incentivizedTwapMaxTradeSize).to.eq(ether(1600));
      expect(sushiSettings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(sushiSettings.leverExchangeData).to.eq(EMPTY_BYTES);
      expect(sushiSettings.deleverExchangeData).to.eq(EMPTY_BYTES);

      expect(uniV3Settings.twapMaxTradeSize).to.eq(ether(2000));
      expect(uniV3Settings.incentivizedTwapMaxTradeSize).to.eq(ether(3000));
      expect(uniV3Settings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(uniV3Settings.leverExchangeData).to.eq(uniV3LeverData);
      expect(uniV3Settings.deleverExchangeData).to.eq(uniV3DeleverData);
    });

    it("should set the correct enabled exchanges", async () => {
      const enabledExchanges = await flexibleLeverageStrategyExtensionInstance.getEnabledExchanges();

      expect(enabledExchanges.length).to.eq(2);
      expect(enabledExchanges[0]).to.eq("SushiswapExchangeAdapter");
      expect(enabledExchanges[1]).to.eq("UniswapV3ExchangeAdapter");
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

  describe("SupplyCapIssuanceHook", async () => {
    it("should set the correct owner", async () => {
      const owner = await supplyCapInstance.owner();

      expect(owner).to.eq(deployer.address);
    });

    it("should set the correct supply cap", async () => {
      const supplyCap = await supplyCapInstance.supplyCap();

      expect(supplyCap).to.eq(ether(50000));
    });
  });
});