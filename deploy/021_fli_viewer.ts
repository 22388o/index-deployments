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
  findDependency,
  DEPENDENCY,
  EMPTY_BYTES,
  writeContractAndTransactionToOutputs
} from "@deployments/utils";

import { CONTRACT_NAMES } from "@deployments/constants/021_fli_viewer";
import { getRandomAddress } from "@utils/accountUtils";

const {
  UNISWAP_V3_QUOTER,
  AMM_SPLITTER,
} = DEPENDENCY;

const CURRENT_STAGE = getCurrentStage(__filename);

const func: DeployFunction = trackFinishedStage(CURRENT_STAGE, async function (hre: HRE) {

  const { deploy, deployer } = await prepareDeployment(hre);

  await polyFillForDevelopment();

  await deployViewer(CONTRACT_NAMES.ETH_FLI_STRATEGY_EXTENSION_NAME, CONTRACT_NAMES.ETH_FLI_VIEWER_NAME);

  await deployViewer(CONTRACT_NAMES.BTC_FLI_STRATEGY_EXTENSION_NAME, CONTRACT_NAMES.BTC_FLI_VIEWER_NAME);

  //
  // Helper Functions
  //

  async function polyFillForDevelopment(): Promise<void> {
    if (await findDependency(UNISWAP_V3_QUOTER) === "") {
      await writeContractAndTransactionToOutputs(UNISWAP_V3_QUOTER, await getRandomAddress(), EMPTY_BYTES, "Created Mock Uniswap V3 Quoter");
    }
    if (await findDependency(AMM_SPLITTER) === "") {
      await writeContractAndTransactionToOutputs(AMM_SPLITTER, await getRandomAddress(), EMPTY_BYTES, "Created Mock AMMSplitter");
    }
  }

  async function deployViewer(fliStrategyExtensionName: string, fliViewerName: string): Promise<void> {

    const checkFLIViewerAddress = await getContractAddress(fliViewerName);
    if (checkFLIViewerAddress === "") {

      const fliExtension = await getContractAddress(fliStrategyExtensionName);
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
          name: fliViewerName,
          contractAddress: fliViewer.address,
          id: fliViewer.receipt.transactionHash,
          description: `Deployed ${fliViewerName}`,
          constructorArgs,
        });
    }
  }
});

func.skip = stageAlreadyFinished(CURRENT_STAGE);

export default func;