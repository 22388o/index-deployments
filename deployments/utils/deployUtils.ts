import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  findDependency,
  getLastDeploymentStage,
  writeStateToOutputs,
  writeTransactionToOutputs,
  ensureOutputsFile,
} from "@deployments/utils/deploys/outputHelper";
import { MerkleDistributorInfo } from "../../utils/types";

import {
  getAccounts,
} from "@utils/index";

import {
  getContractAddress,
  getNetworkConstant,
  InstanceGetter,
  removeNetwork,
  saveContractDeployment,
  saveDeferredTransactionData,
} from "@deployments/utils";
import { Address } from "hardhat-deploy/dist/types";
import { BigNumber } from "ethers";

export function trackFinishedStage(
  currentStage: number,
  func: (env: HardhatRuntimeEnvironment) => Promise<void>
): (env: HardhatRuntimeEnvironment) => Promise<void> {
  return async (env: HardhatRuntimeEnvironment) => {
    await func(env);

    await writeStateToOutputs("last_deployment_stage", currentStage + 1);
  };
}

export function stageAlreadyFinished(currentStage: number): (env: HardhatRuntimeEnvironment) => Promise <boolean> {
  return async (env: HardhatRuntimeEnvironment) => {
    const lastStage = await getLastDeploymentStage();

    return currentStage < lastStage;
  };
}

// Runs at the top of every deploy script, clearing contract addresses when network is development
export async function prepareDeployment(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, rawTx } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkConstant = await getNetworkConstant();
  try {
    if (networkConstant === "development") {
      console.log(`\n*** Clearing all addresses for ${networkConstant} ***\n`);
      await removeNetwork(networkConstant);
    }
  } catch (error) {
    console.log("*** No addresses to wipe *** ");
  }

  await ensureOutputsFile();

  return {
    deploy,
    rawTx,
    deployer,
    networkConstant,
  };
}

// Deploys MerkleDistributor contract
export async function deployMerkleDistributor(
  indexTokenName: string,
  merkleDistributorContractName: string,
  merkleRootObject: MerkleDistributorInfo,
  distributorRewardsContractName: string,
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, run } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // MerkleDistributor has to be compile by itself to Etherscan verify
  await run("set:compile:one", { contractName: merkleDistributorContractName });

  // Fetch INDEX token
  const indexTokenAddress = await getContractAddress(indexTokenName);

  // Deploy Merkle Distributor contract
  const checkMerkleDistributorAddress = await getContractAddress(distributorRewardsContractName);

  if (checkMerkleDistributorAddress === "") {
    const constructorArgs = [indexTokenAddress, merkleRootObject.merkleRoot];
    const merkleDistributorDeploy = await deploy(
      merkleDistributorContractName,
      { from: deployer, args: constructorArgs, log: true }
    );
    merkleDistributorDeploy.receipt &&
      await saveContractDeployment({
        name: distributorRewardsContractName,
        contractAddress: merkleDistributorDeploy.address,
        id: merkleDistributorDeploy.receipt.transactionHash,
        description: `Deployed ${distributorRewardsContractName}`,
        constructorArgs,
      });
  }
}

export async function deployBaseManager(
  hre: HardhatRuntimeEnvironment,
  managerName: string,
  tokenName: string,
  operator: Address,
  methodologist: Address,
) {
  const {
    deploy,
    deployer,
  } = await prepareDeployment(hre);

  const checkBaseManagerAddress = await getContractAddress(managerName);
  if (checkBaseManagerAddress === "") {
    const constructorArgs = [
      await findDependency(tokenName),
      operator,
      methodologist,
    ];

    const baseManagerDeploy = await deploy("BaseManager", {
      from: deployer,
      args: constructorArgs,
      log: true,
    });

    baseManagerDeploy.receipt && await saveContractDeployment({
      name: managerName,
      contractAddress: baseManagerDeploy.address,
      id: baseManagerDeploy.receipt.transactionHash,
      description: `Deployed ${managerName}`,
      constructorArgs,
    });
  }
}

export async function deployGovernanceAdapter(
  hre: HardhatRuntimeEnvironment,
  govAdapterName: string,
  managerName: string,
): Promise<void> {
  const {
    deploy,
    deployer,
  } = await prepareDeployment(hre);

  const checkGovAdapterAddress = await getContractAddress(govAdapterName);
  if (checkGovAdapterAddress === "") {
    const manager = await getContractAddress(managerName);
    const governanceModule = await findDependency("GOVERNANCE_MODULE");

    const constructorArgs = [
      manager,
      governanceModule,
    ];

    const governanceAdapterDeploy = await deploy("GovernanceAdapter", {
      from: deployer,
      args: constructorArgs,
      log: true,
    });

    governanceAdapterDeploy.receipt && await saveContractDeployment({
      name: govAdapterName,
      contractAddress: governanceAdapterDeploy.address,
      id: governanceAdapterDeploy.receipt.transactionHash,
      description: `Deployed ${govAdapterName}`,
      constructorArgs,
    });
  }
}

export async function deployStreamingFeeExtension(
  hre: HardhatRuntimeEnvironment,
  feeExtensionName: string,
  managerName: string,
  feeSplit: BigNumber
): Promise<void> {
  const {
    deploy,
    deployer,
  } = await prepareDeployment(hre);

  const checkFeeExtensionAddress = await getContractAddress(feeExtensionName);
  if (checkFeeExtensionAddress === "") {
    const manager = await getContractAddress(managerName);
    const streamingFeeModule = await findDependency("STREAMING_FEE_MODULE");

    const constructorArgs = [
      manager,
      streamingFeeModule,
      feeSplit,
    ];

    const feeSplitExtensionDeploy = await deploy("StreamingFeeSplitExtension", {
      from: deployer,
      args: constructorArgs,
      log: true,
    });

    feeSplitExtensionDeploy.receipt && await saveContractDeployment({
      name: feeExtensionName,
      contractAddress: feeSplitExtensionDeploy.address,
      id: feeSplitExtensionDeploy.receipt.transactionHash,
      description: `Deployed ${feeExtensionName}`,
      constructorArgs,
    });
  }
}

export async function deployGIMExtension(
  hre: HardhatRuntimeEnvironment,
  gimExtensionName: string,
  managerName: string,
): Promise<void> {
  const {
    deploy,
    deployer,
  } = await prepareDeployment(hre);

  const checkGIMExtensionAddress = await getContractAddress(gimExtensionName);
  if (checkGIMExtensionAddress === "") {
    const manager = await getContractAddress(managerName);
    const generalIndexModule = await findDependency("GENERAL_INDEX_MODULE");

    const constructorArgs = [
      manager,
      generalIndexModule,
    ];

    const gimExtensionDeploy = await deploy("GIMExtension", {
      from: deployer,
      args: constructorArgs,
      log: true,
    });

    gimExtensionDeploy.receipt && await saveContractDeployment({
      name: gimExtensionName,
      contractAddress: gimExtensionDeploy.address,
      id: gimExtensionDeploy.receipt.transactionHash,
      description: `Deployed ${gimExtensionName}`,
      constructorArgs,
    });
  }
}

export async function addAdapter(
  hre: HardhatRuntimeEnvironment,
  managerName: string,
  adapterName: string
): Promise<void> {
  const {
    rawTx,
    deployer,
    networkConstant,
  } = await prepareDeployment(hre);

  const [owner] = await getAccounts();
  const instanceGetter: InstanceGetter = new InstanceGetter(owner.wallet);

  const baseManagerAddress = await getContractAddress(managerName);
  const baseManagerInstance = await instanceGetter.getBaseManager(baseManagerAddress);

  const adapterAddress = await getContractAddress(adapterName);
  if (!await baseManagerInstance.isAdapter(adapterAddress)) {
    const addAdapterData = baseManagerInstance.interface.encodeFunctionData("addAdapter", [adapterAddress]);
    const description = `Add ${adapterName} on ${managerName}`;

    if (networkConstant === "production" || process.env.TESTING_PRODUCTION) {
      await saveDeferredTransactionData({
        data: addAdapterData,
        description,
        contractName: managerName,
      });
    } else {
      const addAdapterTransaction: any = await rawTx({
        from: deployer,
        to: baseManagerInstance.address,
        data: addAdapterData,
        log: true,
      });
      await writeTransactionToOutputs(addAdapterTransaction.transactionHash, description);
    }
  }
}
