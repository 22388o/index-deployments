import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "@ethersproject/bignumber";
import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";
import {
  ether,
  getRandomAddress,
  getAccounts,
} from "@utils/index";

import {
  addExtension,
  deployBaseManager,
  deployFeeExtension,
  prepareDeployment,
  findDependency,
  getContractAddress,
  getCurrentStage,
  writeContractAndTransactionToOutputs,
  saveContractDeployment,
  stageAlreadyFinished,
  trackFinishedStage,
  EMPTY_BYTES,
  DEPENDENCY,
  protectModule,
} from "@deployments/utils";
import {
  AaveContractSettings,
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
} from "@deployments/constants/025_linkfli_system";
import DeployHelper from "@deployments/utils/deploys";

const {
  A_LINK,
  USDC_VARIABLE_DEBT,
  DFP_MULTI_SIG,
  LINKFLI,
  AAVE_LEVERAGE_MODULE,
  AAVE_PROTOCOL_DATA_PROVIDER,
  LINK,
  WETH,
  USDC,
  CHAINLINK_LINK,
  CHAINLINK_USDC,
  AMM_SPLITTER,
  UNISWAP_V3_QUOTER,
  STREAMING_FEE_MODULE,
  DEBT_ISSUANCE_MODULE,
  CONTROLLER,
  TREASURY_OPS_MULTI_SIG,
} = DEPENDENCY;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {

  const {
    deploy,
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

  await deployBaseManager(hre, CONTRACT_NAMES.BASE_MANAGER_NAME, LINKFLI, deployer, dfpMultisigAddress);

  await deployAaveLeverageStrategyExtension();

  await deployFeeExtension(
    hre,
    CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME,
    CONTRACT_NAMES.BASE_MANAGER_NAME,
    FEE_SPLIT_ADAPTER.FEE_SPLIT,
    await findDependency(TREASURY_OPS_MULTI_SIG),
  );

  await deployRebalanceViewer();

  await addExtension(hre, CONTRACT_NAMES.BASE_MANAGER_NAME, CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME);

  await protectModule(
    hre,
    CONTRACT_NAMES.BASE_MANAGER_NAME,
    STREAMING_FEE_MODULE,
    [ CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME ]
  );

  await protectModule(
    hre,
    CONTRACT_NAMES.BASE_MANAGER_NAME,
    DEBT_ISSUANCE_MODULE,
    [ CONTRACT_NAMES.FEE_SPLIT_ADAPTER_NAME ]
  );


  //
  // Helper Functions
  //

  async function polyFillForDevelopment(): Promise<void> {

    const [ owner ] = await getAccounts();
    const deployHelper = new DeployHelper(owner.wallet);

    if (await findDependency(LINKFLI) === "") {

      const { setToken } = await deployHelper.setToken.deployConfiguredSetToken(
        "LINK2x Flexible Leverage Index",
        "LINK2xFLI",
        await getContractAddress(CONTROLLER),
        await getContractAddress(STREAMING_FEE_MODULE),
        await getContractAddress(DEBT_ISSUANCE_MODULE)
      );

      await writeContractAndTransactionToOutputs(LINKFLI, setToken, EMPTY_BYTES, "Created Mock LINKFLI SetToken");
    }

    if (await findDependency(TREASURY_OPS_MULTI_SIG) === "") {
      await writeContractAndTransactionToOutputs(
        TREASURY_OPS_MULTI_SIG,
        await getRandomAddress(),
        EMPTY_BYTES,
        "Created Mock TREASURY_OPS_MULTI_SIG"
      );
    }

    if (await findDependency(CHAINLINK_LINK) === "") {
      await writeContractAndTransactionToOutputs(CHAINLINK_LINK, await getRandomAddress(), EMPTY_BYTES, "Created Mock CHAINLINK_LINK");
    }

    if (await findDependency(LINK) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), LINK, LINK, BigNumber.from(18)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(LINK, token.address, token.receipt.transactionHash, "Created Mock LINK");
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

    if (await findDependency(A_LINK) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), A_LINK, A_LINK, BigNumber.from(18)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(A_LINK, token.address, token.receipt.transactionHash, "Created Mock A_LINK");
    }

    if (await findDependency(USDC_VARIABLE_DEBT) === "") {
      const token = await deploy(
        CONTRACT_NAMES.STANDARD_TOKEN_MOCK,
        { from: deployer, args: [deployer, ether(1000000000), USDC_VARIABLE_DEBT, USDC_VARIABLE_DEBT, BigNumber.from(6)], log: true }
      );
      token.receipt &&
        await writeContractAndTransactionToOutputs(
          USDC_VARIABLE_DEBT,
          token.address,
          token.receipt.transactionHash,
          "Created Mock USDC_VARIABLE_DEBT"
        );
    }

    if (await findDependency(AAVE_LEVERAGE_MODULE) === "") {
      await writeContractAndTransactionToOutputs(AAVE_LEVERAGE_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock AAVE_LEVERAGE_MODULE");
    }

    if (await findDependency(AAVE_PROTOCOL_DATA_PROVIDER) === "") {
      await writeContractAndTransactionToOutputs(
        AAVE_PROTOCOL_DATA_PROVIDER,
        await getRandomAddress(),
        EMPTY_BYTES,
        "Created Mock AAVE_PROTOCOL_DATA_PROVIDER"
      );
    }

    console.log("Polyfilled dependencies");
  }

  async function deployAaveLeverageStrategyExtension(): Promise<void> {
    const checkLeverageExtensionAddress = await getContractAddress(CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME);
    if (checkLeverageExtensionAddress === "") {

      const manager = await getContractAddress(CONTRACT_NAMES.BASE_MANAGER_NAME);

      const contractSettings: AaveContractSettings = {
        aaveProtocolDataProvider: await findDependency(AAVE_PROTOCOL_DATA_PROVIDER),
        setToken: await findDependency(LINKFLI),
        leverageModule: await findDependency(AAVE_LEVERAGE_MODULE),
        targetCollateralAToken: await findDependency(A_LINK),
        targetBorrowDebtToken: await findDependency(USDC_VARIABLE_DEBT),
        collateralAsset: await findDependency(LINK),
        borrowAsset: await findDependency(USDC),
        collateralPriceOracle: await findDependency(CHAINLINK_LINK),
        borrowPriceOracle: await findDependency(CHAINLINK_USDC),
        collateralDecimalAdjustment: CONTRACT_SETTINGS.COLLATERAL_DECIMAL_ADJUSTMENT,
        borrowDecimalAdjustment: CONTRACT_SETTINGS.BORROW_DECIMAL_ADJUSTMENT,
      };

      const methodologySettings: MethodologySettings = METHODOLOGY_SETTINGS;
      const executionSettings: ExecutionSettings = EXECUTION_SETTINGS;
      const incentiveSettings: IncentiveSettings = INCENTIVE_SETTINGS;
      const exchangeNames: string[] = EXCHANGE_NAMES;

      const exchangeSettings: ExchangeSettings[] = EXCHANGE_SETTINGS;

      // add AMMSplitter lever and delever exchange data
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
        ["address", "uint24", "address", "uint24", "address"],
        [contractSettings.borrowAsset, BigNumber.from(3000), await findDependency(WETH), BigNumber.from(3000), contractSettings.collateralAsset]
      );
      exchangeSettings[1].deleverExchangeData = solidityPack(
        ["address", "uint24", "address", "uint24", "address"],
        [contractSettings.collateralAsset, BigNumber.from(3000), await findDependency(WETH), BigNumber.from(3000), contractSettings.borrowAsset]
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

      const leverageDeploy = await deploy(CONTRACT_NAMES.LEVERAGE_EXTENSION, {
        from: deployer,
        args: constructorArgs,
        log: true,
      });

      leverageDeploy.receipt && await saveContractDeployment({
        name: CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME,
        contractAddress: leverageDeploy.address,
        id: leverageDeploy.receipt.transactionHash,
        description: "Deployed LINK AaveLeverageStrategyExtension",
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
        description: "Deployed LINKLFLISupplyCapAllowedCallerIssuanceHook",
        constructorArgs,
      });
    }
  }

  async function deployRebalanceViewer(): Promise<void> {

    const checkFLIViewerAddress = await getContractAddress(CONTRACT_NAMES.FLI_VIEWER_NAME);
    if (checkFLIViewerAddress === "") {

      const fliExtension = await getContractAddress(CONTRACT_NAMES.LEVERAGE_EXTENSION_NAME);
      const uniQuoter = await findDependency(UNISWAP_V3_QUOTER);
      const ammSplitter = await findDependency(AMM_SPLITTER);

      const constructorArgs: any[] = [
        fliExtension,
        uniQuoter,
        ammSplitter,
        CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER,
        CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER,
      ];

      const fliViewer = await deploy(
        CONTRACT_NAMES.FLI_VIEWER,
        { from: deployer, args: constructorArgs, log: true }
      );

      fliViewer.receipt &&
        await saveContractDeployment({
          name: CONTRACT_NAMES.FLI_VIEWER_NAME,
          contractAddress: fliViewer.address,
          id: fliViewer.receipt.transactionHash,
          description: `Deployed ${CONTRACT_NAMES.FLI_VIEWER_NAME}`,
          constructorArgs,
        });
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;