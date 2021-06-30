import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  getRandomAddress,
} from "@utils/index";

import {
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
} from "@deployments/utils";
import {
  CONTRACT_NAMES,
  FEE_SPLIT_ADAPTER
} from "@deployments/constants/019_dpi_new_manager";

const {
  DFP_MULTI_SIG,
  DPI,
  GENERAL_INDEX_MODULE,
  GOVERNANCE_MODULE,
  OPS_MULTI_SIG,
  STREAMING_FEE_MODULE,
  TREASURY_MULTI_SIG,
} = DEPENDENCY;

const {
  BASE_MANAGER_NAME,
  GOVERNANCE_ADAPTER_NAME,
  GIM_EXTENSION_NAME,
  FEE_EXTENSION_NAME,
} = CONTRACT_NAMES;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {
  const {
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

  await deployBaseManager(hre, BASE_MANAGER_NAME, DPI, deployer, dfpMultisigAddress);

  await deployGovernanceAdapter(hre, GOVERNANCE_ADAPTER_NAME, BASE_MANAGER_NAME);
  await deployGIMExtension(hre, GIM_EXTENSION_NAME, BASE_MANAGER_NAME);
  await deployStreamingFeeExtension(hre, FEE_EXTENSION_NAME, BASE_MANAGER_NAME, FEE_SPLIT_ADAPTER.FEE_SPLIT);

  await addExtension(hre, BASE_MANAGER_NAME, GOVERNANCE_ADAPTER_NAME);
  await addExtension(hre, BASE_MANAGER_NAME, GIM_EXTENSION_NAME);
  await addExtension(hre, BASE_MANAGER_NAME, FEE_EXTENSION_NAME);

  await addApprovedCaller(hre, GOVERNANCE_ADAPTER_NAME, [await findDependency(OPS_MULTI_SIG)], [true]);
  await setOperator(hre, BASE_MANAGER_NAME, await findDependency(TREASURY_MULTI_SIG));

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(OPS_MULTI_SIG) === "") {
      await writeContractAndTransactionToOutputs(OPS_MULTI_SIG, await getRandomAddress(), EMPTY_BYTES, "Created OPS_MULTI_SIG");
    }

    if (await findDependency(DPI) === "") {
      await writeContractAndTransactionToOutputs(DPI, await getRandomAddress(), EMPTY_BYTES, "Created Mock DPI");
    }

    if (await findDependency(GOVERNANCE_MODULE) === "") {
      await writeContractAndTransactionToOutputs(GOVERNANCE_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock GovernanceModule");
    }

    if (await findDependency(STREAMING_FEE_MODULE) === "") {
      await writeContractAndTransactionToOutputs(STREAMING_FEE_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock StreamingFeeModule");
    }

    if (await findDependency(GENERAL_INDEX_MODULE) === "") {
      await writeContractAndTransactionToOutputs(GENERAL_INDEX_MODULE, await getRandomAddress(), EMPTY_BYTES, "Created Mock GeneralIndexModule");
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;