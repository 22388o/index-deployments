import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  protectModule,
  addExtension,
  addApprovedCaller,
  DEPENDENCY,
  deployBaseManager,
  deployGIMExtension,
  deployGovernanceAdapter,
  deployStreamingFeeExtension,
  EMPTY_BYTES,
  findDependency,
  getCurrentStage,
  prepareDeployment,
  setOperator,
  stageAlreadyFinished,
  trackFinishedStage,
  writeContractAndTransactionToOutputs,
  getContractAddress,
} from "@deployments/utils";
import {
  CONTRACT_NAMES,
  FEE_SPLIT_ADAPTER
} from "@deployments/constants/024_dpi_manager_with_permissions";

import DeployHelper from "@deployments/utils/deploys";

import { getRandomAddress, getAccounts } from "@utils/index";

const {
  DFP_MULTI_SIG,
  DPI,
  GENERAL_INDEX_MODULE,
  GOVERNANCE_MODULE,
  OPS_MULTI_SIG,
  STREAMING_FEE_MODULE,
  TREASURY_MULTI_SIG,
  CONTROLLER,
} = DEPENDENCY;

const {
  BASE_MANAGER_NAME,
  GOVERNANCE_EXTENSION_NAME,
  GIM_EXTENSION_NAME,
  FEE_EXTENSION_NAME,
} = CONTRACT_NAMES;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {
  const {
    deployer,
    networkConstant,
  } = await prepareDeployment(hre);

  let methodologistAddress: string;
  if (networkConstant === "production") {
    methodologistAddress = await findDependency(DFP_MULTI_SIG);
  } else {
    methodologistAddress = deployer;
  }

  // For the feeExtension (IIP-72). Assigning the final identity of `manager.operator`
  // ... transferred from `deployer` to treasury in a setOperator call below.
  const OPERATOR_FEE_RECIPIENT = await findDependency(TREASURY_MULTI_SIG);

  await polyFillForDevelopment();

  await deployBaseManager(hre, BASE_MANAGER_NAME, DPI, deployer, methodologistAddress);

  await deployGovernanceAdapter(hre, GOVERNANCE_EXTENSION_NAME, BASE_MANAGER_NAME);
  await deployGIMExtension(hre, GIM_EXTENSION_NAME, BASE_MANAGER_NAME);
  await deployStreamingFeeExtension(
    hre,
    FEE_EXTENSION_NAME,
    BASE_MANAGER_NAME,
    FEE_SPLIT_ADAPTER.FEE_SPLIT,
    OPERATOR_FEE_RECIPIENT
 );

  await addExtension(hre, BASE_MANAGER_NAME, GOVERNANCE_EXTENSION_NAME);
  await addExtension(hre, BASE_MANAGER_NAME, GIM_EXTENSION_NAME);

  // This adds the fee extension
  await protectModule(hre, BASE_MANAGER_NAME, STREAMING_FEE_MODULE, [FEE_EXTENSION_NAME]);

  await addApprovedCaller(hre, GOVERNANCE_EXTENSION_NAME, [await findDependency(OPS_MULTI_SIG)], [true]);
  await setOperator(hre, BASE_MANAGER_NAME, await findDependency(TREASURY_MULTI_SIG));

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(OPS_MULTI_SIG) === "") {
      await writeContractAndTransactionToOutputs(
        OPS_MULTI_SIG, await getRandomAddress(), EMPTY_BYTES, "Created OPS_MULTI_SIG"
      );
    }

    const [ owner ] = await getAccounts();
    const deployHelper = new DeployHelper(owner.wallet);

    if (await findDependency(CONTROLLER) === "") {
      const controllerInstance = await deployHelper
        .setV2
        .deployController(deployer);

      await writeContractAndTransactionToOutputs(
        CONTROLLER,
        controllerInstance.address,
        EMPTY_BYTES,
        "Created Mock Controller"
      );
    }

    if (await findDependency(STREAMING_FEE_MODULE) === "") {
      const controllerAddress = await getContractAddress(CONTROLLER);

      const streamingFeeModuleInstance = await deployHelper
        .setV2
        .deployStreamingFeeModule(controllerAddress);

      await writeContractAndTransactionToOutputs(
        STREAMING_FEE_MODULE,
        streamingFeeModuleInstance.address,
        EMPTY_BYTES,
        "Created Mock StreamingFeeModule"
      );
    }

    if (await findDependency(DPI) === "") {
      const { setToken } = await deployHelper.setToken.deployConfiguredSetToken(
        "DefiPulse Index",
        "DPI",
        await getContractAddress(CONTROLLER),
        await getContractAddress(STREAMING_FEE_MODULE),
        ""
      );

      await writeContractAndTransactionToOutputs(DPI, setToken, EMPTY_BYTES, "Created Mock DPI SetToken");
    }

    if (await findDependency(GOVERNANCE_MODULE) === "") {
      await writeContractAndTransactionToOutputs(
        GOVERNANCE_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock GovernanceModule"
      );
    }

    if (await findDependency(STREAMING_FEE_MODULE) === "") {
      await writeContractAndTransactionToOutputs(
        STREAMING_FEE_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock StreamingFeeModule"
      );
    }

    if (await findDependency(GENERAL_INDEX_MODULE) === "") {
      await writeContractAndTransactionToOutputs(
        GENERAL_INDEX_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock GeneralIndexModule"
      );
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;