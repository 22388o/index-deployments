import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "@ethersproject/bignumber";
import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";
import {
  ether,
  getAccounts,
  getRandomAddress,
} from "@utils/index";

import {
  prepareDeployment,
  findDependency,
  getContractAddress,
  getCurrentStage,
  writeTransactionToOutputs,
  writeContractAndTransactionToOutputs,
  saveContractDeployment,
  stageAlreadyFinished,
  trackFinishedStage,
  InstanceGetter,
  EMPTY_BYTES,
  DEPENDENCY
} from "@deployments/utils";
import {
  Account,
  ContractSettings,
  MethodologySettings,
  ExecutionSettings,
  IncentiveSettings,
  ExchangeSettings
} from "@utils/types";
import {
  CONTRACT_NAMES,
  CONTRACT_SETTINGS,
  FEE_SPLIT_ADAPTER,
  SUPPLY_CAP_ISSUANCE_HOOK,
  METHODOLOGY_SETTINGS,
  EXECUTION_SETTINGS,
  INCENTIVE_SETTINGS,
  EXCHANGE_NAMES,
  EXCHANGE_SETTINGS
} from "@deployments/constants/012_btcfli_system";

const {
  C_WBTC,
  C_USDC,
  DFP_MULTI_SIG,
  BTCFLI,
  DEBT_ISSUANCE_MODULE,
  COMPOUND_LEVERAGE_MODULE,
  COMPOUND_COMPTROLLER,
  STREAMING_FEE_MODULE,
  WBTC,
  WETH,
  USDC,
  CHAINLINK_BTC,
  CHAINLINK_USDC,
} = DEPENDENCY;

/**
 * CHANGELOG
 *
 * 6/29/21: 9f0fce35138c05b5e152e24a82377c5e4657a519
 * - Update name of FlexibleLeverageStrategyAdapter to FlexibleLeverageStrategyExtension
 * - Update FlexibleLeverageStrategyExtension constructor parameters with new exchange settings format
 */

let owner: Account;
let instanceGetter: InstanceGetter;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {
  [owner] = await getAccounts();
  instanceGetter = new InstanceGetter(owner.wallet);

  const {
    deploy,
    rawTx,
    deployer,
    networkConstant,
  } = await prepareDeployment(hre);

  let dfpMultisigAddress: string;
  if (networkConstant === "production") {
    dfpMultisigAddress = await findDependency(DFP_MULTI_SIG);
  } else {
    dfpMultisigAddress = deployer;
  }

  await polyFillForDevelopment();

  await deploySupplyCapIssuanceHook();

  await deployBaseManager();

  await deployFlexibleLeverageStrategyExtension();

  await deployFeeAdapter();

  await addAdapter(CONTRACT_NAMES.BASE_MANAGER_NAME, CONTRACT_NAMES.FLEXIBLE_LEVERAGE_EXTENSION_NAME);
  await addAdapter(CONTRACT_NAMES.BASE_MANAGER_NAME, CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME);

  //
  // Helper Functions
  //

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(BTCFLI) === "") {
      await writeContractAndTransactionToOutputs(BTCFLI, await getRandomAddress(), EMPTY_BYTES, "Created Mock BTCFLI");
    }

    if (await findDependency(CHAINLINK_BTC) === "") {
      await writeContractAndTransactionToOutputs(CHAINLINK_BTC, await getRandomAddress(), EMPTY_BYTES, "Created Mock CHAINLINK_BTC");
    }

    if (await findDependency(WBTC) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), WBTC, WBTC, BigNumber.from(18)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(WBTC, token.address, token.receipt.transactionHash, "Created Mock WBTC");
    }

    if (await findDependency(USDC) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), USDC, USDC, BigNumber.from(6)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(USDC, token.address, token.receipt.transactionHash, "Created Mock USDC");
    }

    if (await findDependency(WETH) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), WETH, WETH, BigNumber.from(18)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(WETH, token.address, token.receipt.transactionHash, "Created Mock WETH");
    }

    if (await findDependency(C_WBTC) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), C_WBTC, C_WBTC, BigNumber.from(8)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(C_WBTC, token.address, token.receipt.transactionHash, "Created Mock C_WBTC");
    }

    if (await findDependency(C_USDC) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), C_USDC, C_USDC, BigNumber.from(8)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(C_USDC, token.address, token.receipt.transactionHash, "Created Mock C_USDC");
    }

    console.log("Polyfilled dependencies");
  }

  async function deployBaseManager(): Promise<void> {
    const checkBaseManagerAddress = await getContractAddress(CONTRACT_NAMES.BASE_MANAGER_NAME);
    if (checkBaseManagerAddress === "") {
      const constructorArgs = [
        await findDependency(BTCFLI),
        deployer, // Set operator to deployer for now
        dfpMultisigAddress, // Set methodologist to DFP
      ];

      const icManagerV2Deploy = await deploy(CONTRACT_NAMES.BASE_MANAGER, {
        from: deployer,
        args: constructorArgs,
        log: true,
      });

      icManagerV2Deploy.receipt && await saveContractDeployment({
        name: CONTRACT_NAMES.BASE_MANAGER_NAME,
        contractAddress: icManagerV2Deploy.address,
        id: icManagerV2Deploy.receipt.transactionHash,
        description: "Deployed BaseManager",
        constructorArgs,
      });
    }
  }

  async function deployFlexibleLeverageStrategyExtension(): Promise<void> {
    const checkFlexibleLeverageExtensionAddress = await getContractAddress(CONTRACT_NAMES.FLEXIBLE_LEVERAGE_EXTENSION_NAME);
    if (checkFlexibleLeverageExtensionAddress === "") {
      const manager = await getContractAddress(CONTRACT_NAMES.BASE_MANAGER_NAME);

      const contractSettings: ContractSettings = {
        setToken: await findDependency(BTCFLI),
        leverageModule: await findDependency(COMPOUND_LEVERAGE_MODULE),
        comptroller: await findDependency(COMPOUND_COMPTROLLER),
        targetCollateralCToken: await findDependency(C_WBTC),
        targetBorrowCToken: await findDependency(C_USDC),
        collateralAsset: await findDependency(WBTC),
        borrowAsset: await findDependency(USDC),
        collateralPriceOracle: await findDependency(CHAINLINK_BTC),
        borrowPriceOracle: await findDependency(CHAINLINK_USDC),
        collateralDecimalAdjustment: CONTRACT_SETTINGS.COLLATERAL_DECIMAL_ADJUSTMENT,
        borrowDecimalAdjustment: CONTRACT_SETTINGS.BORROW_DECIMAL_ADJUSTMENT,
      };
      const methodologySettings: MethodologySettings = METHODOLOGY_SETTINGS;
      const executionSettings: ExecutionSettings = EXECUTION_SETTINGS;
      const incentiveSettings: IncentiveSettings = INCENTIVE_SETTINGS;
      const exchangeNames: string[] = EXCHANGE_NAMES;

      const exchangeSettings: ExchangeSettings[] = EXCHANGE_SETTINGS;

      // add Sushiswap lever and delever exchange data
      exchangeSettings[0].leverExchangeData = defaultAbiCoder.encode(
        ["address[]"],
        [[contractSettings.borrowAsset, await findDependency(WETH), contractSettings.collateralAsset]]
      );
      exchangeSettings[0].deleverExchangeData = defaultAbiCoder.encode(
        ["address[]"],
        [[contractSettings.collateralAsset, await findDependency(WETH), contractSettings.borrowAsset]]
      );

      // add Uniswap V3 lever and delever data
      exchangeSettings[1].leverExchangeData = solidityPack(
        ["address", "uint24", "address"],
        [contractSettings.borrowAsset, BigNumber.from(3000), contractSettings.collateralAsset]
      );
      exchangeSettings[1].deleverExchangeData = solidityPack(
        ["address", "uint24", "address"],
        [contractSettings.collateralAsset, BigNumber.from(3000), contractSettings.borrowAsset]
      );

      const constructorArgs = [
        manager,
        contractSettings,
        methodologySettings,
        executionSettings,
        incentiveSettings,
        exchangeNames,
        exchangeSettings,
      ];
      const flexibleLeverageDeploy = await deploy(CONTRACT_NAMES.FLEXIBLE_LEVERAGE_EXTENSION, {
        from: deployer,
        args: constructorArgs,
        log: true,
      });

      flexibleLeverageDeploy.receipt && await saveContractDeployment({
        name: CONTRACT_NAMES.FLEXIBLE_LEVERAGE_EXTENSION_NAME,
        contractAddress: flexibleLeverageDeploy.address,
        id: flexibleLeverageDeploy.receipt.transactionHash,
        description: "Deployed BTC FlexibleLeverageStrategyExtension",
        constructorArgs,
      });
    }
  }

  async function deployFeeAdapter(): Promise<void> {
    const checkFeeAdapterAddress = await getContractAddress(CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME);
    if (checkFeeAdapterAddress === "") {
      const manager = await getContractAddress(CONTRACT_NAMES.BASE_MANAGER_NAME);
      const streamingFeeModule = await findDependency(STREAMING_FEE_MODULE);
      const debtIssuanceModule = await findDependency(DEBT_ISSUANCE_MODULE);
      const feeSplit = FEE_SPLIT_ADAPTER.FEE_SPLIT;

      const constructorArgs = [
        manager,
        streamingFeeModule,
        debtIssuanceModule,
        feeSplit,
      ];

      const feeSplitAdapterDeploy = await deploy(CONTRACT_NAMES.FEE_SPLIT_ADAPTER, {
        from: deployer,
        args: constructorArgs,
        log: true,
      });

      feeSplitAdapterDeploy.receipt && await saveContractDeployment({
        name: CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME,
        contractAddress: feeSplitAdapterDeploy.address,
        id: feeSplitAdapterDeploy.receipt.transactionHash,
        description: "Deployed Fee Split Adapter",
        constructorArgs,
      });
    }
  }

  async function deploySupplyCapIssuanceHook(): Promise<void> {
    const checkSupplyCapIssuanceHookAddress = await getContractAddress(CONTRACT_NAMES.SUPPLY_CAP_ISSUANCE_HOOK_NAME);
    if (checkSupplyCapIssuanceHookAddress === "") {
      const constructorArgs = [
        deployer, // Set to deployer address for now until configured
        SUPPLY_CAP_ISSUANCE_HOOK.SUPPLY_CAP,
      ];

      const supplyCapDeploy = await deploy(CONTRACT_NAMES.SUPPLY_CAP_ISSUANCE_HOOK, {
        from: deployer,
        args: constructorArgs,
        log: true,
      });

      supplyCapDeploy.receipt && await saveContractDeployment({
        name: CONTRACT_NAMES.SUPPLY_CAP_ISSUANCE_HOOK_NAME,
        contractAddress: supplyCapDeploy.address,
        id: supplyCapDeploy.receipt.transactionHash,
        description: "Deployed BTCFLISupplyCapAllowedCallerIssuanceHook",
        constructorArgs,
      });
    }
  }

  async function addAdapter(icManagerName: string, adapterName: string): Promise<void> {
    const baseManagerAddress = await getContractAddress(icManagerName);
    const baseManagerInstance = await instanceGetter.getBaseManager(baseManagerAddress);

    const adapterAddress = await getContractAddress(adapterName);
    if (!await baseManagerInstance.isAdapter(adapterAddress)) {
      const addAdapterData = baseManagerInstance.interface.encodeFunctionData("addAdapter", [adapterAddress]);
      const addAdapterTransaction: any = await rawTx({
        from: deployer,
        to: baseManagerInstance.address,
        data: addAdapterData,
        log: true,
      });
      await writeTransactionToOutputs(addAdapterTransaction.transactionHash, `Add adapter on BaseManager`);
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;