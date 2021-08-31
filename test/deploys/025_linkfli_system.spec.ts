import "module-alias/register";
import { deployments } from "hardhat";
import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";

import { Account } from "@utils/types";
import {
  BaseManagerV2,
  FeeSplitExtension,
  FLIRebalanceViewer,
  SupplyCapAllowedCallerIssuanceHook,
  AaveLeverageStrategyExtension,
  BaseManagerV2__factory,
  FeeSplitExtension__factory,
  FLIRebalanceViewer__factory,
  SupplyCapAllowedCallerIssuanceHook__factory,
  AaveLeverageStrategyExtension__factory,
} from "@set/typechain/index";

import { BigNumber } from "@ethersproject/bignumber";
import {
  addSnapshotBeforeRestoreAfterEach,
  ether,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";
import {
  DEPENDENCY,
  findDependency,
  getContractAddress,
  ONE_DAY_IN_SECONDS,
} from "@deployments/utils";
import { CONTRACT_NAMES, CONTRACT_SETTINGS } from "@deployments/constants/025_linkfli_system";

const {
  LINKFLI,
  USDC,
  LINK,
  WETH,
  A_LINK,
  USDC_VARIABLE_DEBT,
  AMM_SPLITTER,
  UNISWAP_V3_QUOTER,
  CHAINLINK_LINK,
  CHAINLINK_USDC,
  AAVE_LEVERAGE_MODULE,
  AAVE_PROTOCOL_DATA_PROVIDER,
  STREAMING_FEE_MODULE,
  DEBT_ISSUANCE_MODULE,
  TREASURY_OPS_MULTI_SIG,
} = DEPENDENCY;

const expect = getWaffleExpect();

describe("LINKFLI System", () => {
  let deployer: Account;

  let baseManagerInstance: BaseManagerV2;
  let leverageStrategyExtensionInstance: AaveLeverageStrategyExtension;
  let feeSplitExtensionInstance: FeeSplitExtension;
  let supplyCapInstance: SupplyCapAllowedCallerIssuanceHook;
  let rebalanceViewer: FLIRebalanceViewer;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedBaseManagerContract = await getContractAddress(CONTRACT_NAMES.BASE_MANAGER_NAME);
    baseManagerInstance = new BaseManagerV2__factory(deployer.wallet).attach(deployedBaseManagerContract);

    const deployedLeverageStrategyExtensionContract = await getContractAddress(CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME);
    leverageStrategyExtensionInstance =
      new AaveLeverageStrategyExtension__factory(deployer.wallet).attach(deployedLeverageStrategyExtensionContract);

    const deployedFeeSplitExtensionContract = await getContractAddress(CONTRACT_NAMES.FEE_SPLIT_EXTENSION_NAME);
    feeSplitExtensionInstance = new FeeSplitExtension__factory(deployer.wallet).attach(deployedFeeSplitExtensionContract);

    const deployedSupplyCapAllowedCallerIssuanceHookContract = await getContractAddress(CONTRACT_NAMES.SUPPLY_CAP_ISSUANCE_HOOK_NAME);
    supplyCapInstance = new SupplyCapAllowedCallerIssuanceHook__factory(deployer.wallet).attach(deployedSupplyCapAllowedCallerIssuanceHookContract);

    const deployedRebalanceViewer = await getContractAddress(CONTRACT_NAMES.FLI_VIEWER_NAME);
    rebalanceViewer = new FLIRebalanceViewer__factory(deployer.wallet).attach(deployedRebalanceViewer);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("BaseManagerV2", async () => {
    it("should have the correct SetToken address", async () => {
      const setToken = await baseManagerInstance.setToken();
      expect(setToken).to.eq(await findDependency(LINKFLI));
    });

    it("should have the correct operator address", async () => {
      const operator = await baseManagerInstance.operator();
      expect(operator).to.eq(deployer.address);
    });

    it("should have the correct methodologist address", async () => {
      const methodologist = await baseManagerInstance.methodologist();
      expect(methodologist).to.eq(deployer.address);
    });

    it("should have the correct extensions", async () => {
      const extensions = await baseManagerInstance.getExtensions();
      expect(extensions[0]).to.eq(leverageStrategyExtensionInstance.address);
      expect(extensions[1]).to.eq(feeSplitExtensionInstance.address);
    });
  });

  describe("AaveLeverageStrategyExtension", async () => {
    it("should set the manager", async () => {
      const manager = await leverageStrategyExtensionInstance.manager();

      expect(manager).to.eq(baseManagerInstance.address);
    });

    it("should set the contract addresses", async () => {
      const strategy = await leverageStrategyExtensionInstance.getStrategy();

      expect(strategy.setToken).to.eq(await findDependency(LINKFLI));
      expect(strategy.leverageModule).to.eq(await findDependency(AAVE_LEVERAGE_MODULE));
      expect(strategy.aaveProtocolDataProvider).to.eq(await findDependency(AAVE_PROTOCOL_DATA_PROVIDER));
      expect(strategy.targetCollateralAToken).to.eq(await findDependency(A_LINK));
      expect(strategy.targetBorrowDebtToken).to.eq(await findDependency(USDC_VARIABLE_DEBT));
      expect(strategy.collateralAsset).to.eq(await findDependency(LINK));
      expect(strategy.borrowAsset).to.eq(await findDependency(USDC));
      expect(strategy.collateralPriceOracle).to.eq(await findDependency(CHAINLINK_LINK));
      expect(strategy.borrowPriceOracle).to.eq(await findDependency(CHAINLINK_USDC));
      expect(strategy.collateralDecimalAdjustment).to.eq(CONTRACT_SETTINGS.COLLATERAL_DECIMAL_ADJUSTMENT);
      expect(strategy.borrowDecimalAdjustment).to.eq(CONTRACT_SETTINGS.BORROW_DECIMAL_ADJUSTMENT);
    });

    it("should set the correct methodology parameters", async () => {
      const methodology = await leverageStrategyExtensionInstance.getMethodology();

      expect(methodology.targetLeverageRatio).to.eq(ether(2));
      expect(methodology.minLeverageRatio).to.eq(ether(1.8));
      expect(methodology.maxLeverageRatio).to.eq(ether(2.2));
      expect(methodology.recenteringSpeed).to.eq(ether(0.1));
      expect(methodology.rebalanceInterval).to.eq(ONE_DAY_IN_SECONDS);
    });

    it("should set the correct execution parameters", async () => {
      const execution = await leverageStrategyExtensionInstance.getExecution();

      expect(execution.unutilizedLeveragePercentage).to.eq(ether(0.01));
      expect(execution.twapCooldownPeriod).to.eq(BigNumber.from(30));
      expect(execution.slippageTolerance).to.eq(ether(0.02));
    });

    it("should set the correct incentive parameters", async () => {
      const incentive = await leverageStrategyExtensionInstance.getIncentive();

      expect(incentive.incentivizedTwapCooldownPeriod).to.eq(BigNumber.from(1));
      expect(incentive.incentivizedSlippageTolerance).to.eq(ether(0.05));
      expect(incentive.etherReward).to.eq(ether(1.5));
      expect(incentive.incentivizedLeverageRatio).to.eq(ether(2.4));
    });

    it("should set the correct exchange settings", async () => {
      const ammSplitterSettings = await leverageStrategyExtensionInstance.getExchangeSettings(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      const uniV3Settings = await leverageStrategyExtensionInstance.getExchangeSettings(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);

      const sushiLeverData = defaultAbiCoder.encode(
        ["address[]"],
        [[await findDependency(USDC), await findDependency(WETH), await findDependency(LINK)]]
      );
      const sushiDeleverData = defaultAbiCoder.encode(
        ["address[]"],
        [[await findDependency(LINK), await findDependency(WETH), await findDependency(USDC)]]
      );

      const uniV3LeverData = solidityPack(
        ["address", "uint24", "address", "uint24", "address"],
        [await findDependency(USDC), BigNumber.from(3000), await findDependency(WETH), BigNumber.from(3000), await findDependency(LINK)]
      );
      const uniV3DeleverData = solidityPack(
        ["address", "uint24", "address", "uint24", "address"],
        [await findDependency(LINK), BigNumber.from(3000), await findDependency(WETH), BigNumber.from(3000), await findDependency(USDC)]
      );

      expect(ammSplitterSettings.twapMaxTradeSize).to.eq(ether(1000));
      expect(ammSplitterSettings.incentivizedTwapMaxTradeSize).to.eq(ether(2000));
      expect(ammSplitterSettings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(ammSplitterSettings.leverExchangeData).to.eq(sushiLeverData);
      expect(ammSplitterSettings.deleverExchangeData).to.eq(sushiDeleverData);

      expect(uniV3Settings.twapMaxTradeSize).to.eq(ether(5000));
      expect(uniV3Settings.incentivizedTwapMaxTradeSize).to.eq(ether(10000));
      expect(uniV3Settings.exchangeLastTradeTimestamp).to.eq(BigNumber.from(0));
      expect(uniV3Settings.leverExchangeData).to.eq(uniV3LeverData);
      expect(uniV3Settings.deleverExchangeData).to.eq(uniV3DeleverData);
    });


    it("should set the correct enabled exchanges", async () => {
      const enabledExchanges = await leverageStrategyExtensionInstance.getEnabledExchanges();

      expect(enabledExchanges.length).to.eq(2);
      expect(enabledExchanges[0]).to.eq(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      expect(enabledExchanges[1]).to.eq(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);
    });
  });

  describe("FeeSplitExtension", async () => {
    it("should set the correct addresses", async () => {
      const manager = await feeSplitExtensionInstance.manager();
      const streamingFeeModule = await feeSplitExtensionInstance.streamingFeeModule();
      const issuanceModule = await feeSplitExtensionInstance.issuanceModule();
      const operatorFeeSplit = await feeSplitExtensionInstance.operatorFeeSplit();
      const operatorFeeRecipient = await feeSplitExtensionInstance.operatorFeeRecipient();

      expect(manager).to.eq(baseManagerInstance.address);
      expect(streamingFeeModule).to.eq(await findDependency(STREAMING_FEE_MODULE));
      expect(issuanceModule).to.eq(await findDependency(DEBT_ISSUANCE_MODULE));
      expect(operatorFeeSplit).to.eq(ether(0.6));
      expect(operatorFeeRecipient).to.eq(await findDependency(TREASURY_OPS_MULTI_SIG));
    });
  });

  describe("SupplyCapAllowedCallerIssuanceHook", async () => {
    it("should set the correct owner", async () => {
      const owner = await supplyCapInstance.owner();

      expect(owner).to.eq(deployer.address);
    });

    it("should set the correct supply cap", async () => {
      const supplyCap = await supplyCapInstance.supplyCap();

      expect(supplyCap).to.eq(ether(200000));
    });
  });

  describe("FLIRebalanceViewer", async () => {
    it("should set the correct addresses", async () => {
      expect(await rebalanceViewer.uniswapV2ExchangeName()).to.eq(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      expect(await rebalanceViewer.uniswapV3ExchangeName()).to.eq(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);
      expect(await rebalanceViewer.uniswapV2Router()).to.eq(await findDependency(AMM_SPLITTER));
      expect(await rebalanceViewer.uniswapV3Quoter()).to.eq(await findDependency(UNISWAP_V3_QUOTER));
      expect(await rebalanceViewer.fliStrategyExtension()).to.eq(await findDependency(CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME));
    });
  });
});