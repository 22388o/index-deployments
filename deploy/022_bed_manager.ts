import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  getRandomAddress,
} from "@utils/index";

import {
  addExtension,
  DEPENDENCY,
  deployBaseManager,
  deployGIMExtension,
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
} from "@deployments/constants/022_bed_manager";

const {
  BANKLESS_MULTI_SIG,
  BED,
  GENERAL_INDEX_MODULE,
  STREAMING_FEE_MODULE,
  TREASURY_MULTI_SIG,
} = DEPENDENCY;

const {
  BASE_MANAGER_NAME,
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
    methodologistAddress = await findDependency(BANKLESS_MULTI_SIG);
  } else {
    methodologistAddress = deployer;
  }

  // For the feeExtension (IIP-72). Assigning the final identity of `manager.operator`
  // ... transferred from `deployer` to treasury in a setOperator call below.
  const OPERATOR_FEE_RECIPIENT = await findDependency(TREASURY_MULTI_SIG);

  await polyFillForDevelopment();

  await deployBaseManager(hre, BASE_MANAGER_NAME, BED, deployer, methodologistAddress);

  await deployGIMExtension(hre, GIM_EXTENSION_NAME, BASE_MANAGER_NAME);
  await deployStreamingFeeExtension(
    hre,
    FEE_EXTENSION_NAME,
    BASE_MANAGER_NAME,
    FEE_SPLIT_ADAPTER.FEE_SPLIT,
    OPERATOR_FEE_RECIPIENT
  );

  await addExtension(hre, BASE_MANAGER_NAME, GIM_EXTENSION_NAME);
  await addExtension(hre, BASE_MANAGER_NAME, FEE_EXTENSION_NAME);

  await setOperator(hre, BASE_MANAGER_NAME, await findDependency(TREASURY_MULTI_SIG));

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(BED) === "") {
      await writeContractAndTransactionToOutputs(BED, await getRandomAddress(), EMPTY_BYTES, "Created Mock BED");
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