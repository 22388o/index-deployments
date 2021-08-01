import "module-alias/register";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  prepareDeployment,
  getCurrentStage,
  stageAlreadyFinished,
  trackFinishedStage,
  getContractAddress,
  saveContractDeployment,
  DEPENDENCY,
  writeContractAndTransactionToOutputs,
  findDependency,
  EMPTY_BYTES,
} from "@deployments/utils";

import { CONTRACT_NAMES } from "@deployments/constants/023_fee_claim_keeper";
import { getRandomAddress } from "@utils/accountUtils";

const { CHAINLINK_GAS } = DEPENDENCY;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {

  const { deploy, deployer } = await prepareDeployment(hre);

  await polyFillForDevelopment();

  const checkFeeClaimKeeperAddress = await getContractAddress(CONTRACT_NAMES.FEE_CLAIM_KEEPER);
  if (checkFeeClaimKeeperAddress === "") {

    const constructorArgs = [ await findDependency(CHAINLINK_GAS) ];

    const feeClaimKeeper = await deploy(
      CONTRACT_NAMES.FEE_CLAIM_KEEPER,
      { from: deployer, args: constructorArgs, log: true}
    );

    feeClaimKeeper.receipt &&
      await saveContractDeployment({
        name: CONTRACT_NAMES.FEE_CLAIM_KEEPER,
        contractAddress: feeClaimKeeper.address,
        id: feeClaimKeeper.receipt.transactionHash,
        description: `Deployed ${CONTRACT_NAMES.FEE_CLAIM_KEEPER}`,
        constructorArgs,
      });
  }

  //
  // Helper Functions
  //
  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(CHAINLINK_GAS) === "") {
      await writeContractAndTransactionToOutputs(CHAINLINK_GAS, await getRandomAddress(), EMPTY_BYTES, "Created Mock Chainlink Gas Price Feed");
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;