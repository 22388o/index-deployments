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

    const baseManagerDeploy = await deploy("BaseManagerV2", {
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

export async function deployGovernanceExtension(
  hre: HardhatRuntimeEnvironment,
  govExtensionName: string,
  managerName: string,
): Promise<void> {
  const {
    deploy,
    deployer,
  } = await prepareDeployment(hre);

  const checkGovExtensionAddress = await getContractAddress(govExtensionName);
  if (checkGovExtensionAddress === "") {
    const manager = await getContractAddress(managerName);
    const governanceModule = await findDependency("GOVERNANCE_MODULE");

    const constructorArgs = [
      manager,
      governanceModule,
    ];

    const governanceExtensionDeploy = await deploy("GovernanceExtension", {
      from: deployer,
      args: constructorArgs,
      log: true,
    });

    governanceExtensionDeploy.receipt && await saveContractDeployment({
      name: govExtensionName,
      contractAddress: governanceExtensionDeploy.address,
      id: governanceExtensionDeploy.receipt.transactionHash,
      description: `Deployed ${govExtensionName}`,
      constructorArgs,
    });
  }
}

// Alias
export const deployGovernanceAdapter = deployGovernanceExtension;

export async function deployStreamingFeeExtension(
  hre: HardhatRuntimeEnvironment,
  feeExtensionName: string,
  managerName: string,
  feeSplit: BigNumber,
  operatorFeeRecipient: Address
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
      operatorFeeRecipient,
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

export async function addExtension(
  hre: HardhatRuntimeEnvironment,
  managerName: string,
  extensionName: string
): Promise<void> {
  const {
    rawTx,
    deployer,
  } = await prepareDeployment(hre);

  const [owner] = await getAccounts();
  const instanceGetter: InstanceGetter = new InstanceGetter(owner.wallet);

  const baseManagerAddress = await getContractAddress(managerName);
  const baseManagerInstance = await instanceGetter.getBaseManagerV2(baseManagerAddress);

  const extensionAddress = await getContractAddress(extensionName);
  if (!await baseManagerInstance.isExtension(extensionAddress)) {
    const addExtensionData = baseManagerInstance.interface.encodeFunctionData("addExtension", [extensionAddress]);
    const description = `Add ${extensionName} on ${managerName}`;

    const operator = await baseManagerInstance.operator();

    if (process.env.TESTING_PRODUCTION || operator != deployer) {
      await saveDeferredTransactionData({
        data: addExtensionData,
        description,
        contractName: managerName,
      });
    } else {
      const addExtensionTransaction: any = await rawTx({
        from: deployer,
        to: baseManagerInstance.address,
        data: addExtensionData,
        log: true,
      });
      await writeTransactionToOutputs(addExtensionTransaction.transactionHash, description);
    }
  }
}

export async function protectModule(
  hre: HardhatRuntimeEnvironment,
  managerName: string,
  moduleName: string,
  extensionNames: string[]
): Promise<void> {
  const {
    rawTx,
    deployer,
  } = await prepareDeployment(hre);

  const [owner] = await getAccounts();
  const instanceGetter: InstanceGetter = new InstanceGetter(owner.wallet);

  const baseManagerAddress = await getContractAddress(managerName);
  const baseManagerInstance = await instanceGetter.getBaseManagerV2(baseManagerAddress);

  const moduleAddress = await findDependency(moduleName);

  const extensionAddresses = [];
  for (const name of extensionNames) {
    extensionAddresses.push(await getContractAddress(name));
  }

  if (!await baseManagerInstance.protectedModules(moduleAddress)) {
    const protectModuleData = baseManagerInstance
      .interface
      .encodeFunctionData("protectModule", [moduleAddress, extensionAddresses]);

    const description = `Protecting module ${moduleName} on ${managerName}`;

    const operator = await baseManagerInstance.operator();

    if (operator != deployer) {
      await saveDeferredTransactionData({
        data: protectModuleData,
        description,
        contractName: managerName,
      });
    } else {
      const addExtensionTransaction: any = await rawTx({
        from: deployer,
        to: baseManagerInstance.address,
        data: protectModuleData,
        log: true,
      });
      await writeTransactionToOutputs(addExtensionTransaction.transactionHash, description);
    }
  }
}

export async function setOperator(
  hre: HardhatRuntimeEnvironment,
  managerName: string,
  newOperator: Address,
): Promise<void> {
  const {
    rawTx,
    deployer,
  } = await prepareDeployment(hre);

  const [owner] = await getAccounts();
  const instanceGetter: InstanceGetter = new InstanceGetter(owner.wallet);

  const baseManagerAddress = await getContractAddress(managerName);
  const baseManagerInstance = await instanceGetter.getBaseManager(baseManagerAddress);
  const currentOperator = await baseManagerInstance.operator();

  if (currentOperator != newOperator) {
    const setOperatorData = baseManagerInstance.interface.encodeFunctionData("setOperator", [newOperator]);
    const description = `${newOperator} set as operator on ${managerName}`;

    if (currentOperator != deployer) {
      await saveDeferredTransactionData({
        data: setOperatorData,
        description,
        contractName: managerName,
      });
    } else {
      const setOperatorTransaction: any = await rawTx({
        from: deployer,
        to: baseManagerInstance.address,
        data: setOperatorData,
        log: true,
      });
      await writeTransactionToOutputs(setOperatorTransaction.transactionHash, description);
    }
  }
}

export async function addApprovedCaller(
  hre: HardhatRuntimeEnvironment,
  extensionName: string,
  callers: Address[],
  statuses: boolean[]
): Promise<void> {
  const {
    rawTx,
    deployer,
  } = await prepareDeployment(hre);

  const [owner] = await getAccounts();
  const instanceGetter: InstanceGetter = new InstanceGetter(owner.wallet);

  const extensionAddress = await getContractAddress(extensionName);
  const extensionInstance = await instanceGetter.getExtension(extensionAddress);

  const updateCallerData = extensionInstance.interface.encodeFunctionData(
    "updateCallerStatus",
    [callers, statuses]
  );
  const description = `${extensionName} caller statuses updated.`;

  const managerAddress = await extensionInstance.manager();
  const baseManagerInstance = await instanceGetter.getBaseManager(managerAddress);
  const operator = await baseManagerInstance.operator();

  if (operator != deployer) {
    await saveDeferredTransactionData({
      data: updateCallerData,
      description,
      contractName: extensionName,
    });
  } else {
    const addCallerTransaction: any = await rawTx({
      from: deployer,
      to: extensionInstance.address,
      data: updateCallerData,
      log: true,
    });
    await writeTransactionToOutputs(addCallerTransaction.transactionHash, description);
  }
}
