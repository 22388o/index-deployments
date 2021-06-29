import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  getRandomAddress,
} from "@utils/index";

import {
  addAdapter,
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
} from "@deployments/constants/020_mvi_new_manager";

const {
  TREASURY_MULTI_SIG,
  MVI,
  GENERAL_INDEX_MODULE,
  STREAMING_FEE_MODULE,
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

  let treasuryMultiSig: string;
  if (networkConstant === "production") {
    treasuryMultiSig = await findDependency(TREASURY_MULTI_SIG);
  } else {
    treasuryMultiSig = deployer;
  }

  await polyFillForDevelopment();

  await deployBaseManager(hre, BASE_MANAGER_NAME, MVI, deployer, treasuryMultiSig);

  await deployGIMExtension(hre, GIM_EXTENSION_NAME, BASE_MANAGER_NAME);
  await deployStreamingFeeExtension(hre, FEE_EXTENSION_NAME, BASE_MANAGER_NAME, FEE_SPLIT_ADAPTER.FEE_SPLIT);

  await addAdapter(hre, BASE_MANAGER_NAME, GIM_EXTENSION_NAME);
  await addAdapter(hre, BASE_MANAGER_NAME, FEE_EXTENSION_NAME);

  await setOperator(hre, BASE_MANAGER_NAME, await findDependency(TREASURY_MULTI_SIG));

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(MVI) === "") {
      await writeContractAndTransactionToOutputs(MVI, await getRandomAddress(), EMPTY_BYTES, "Created Mock MVI");
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