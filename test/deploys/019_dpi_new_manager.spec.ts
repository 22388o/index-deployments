import "module-alias/register";
import { deployments } from "hardhat";

import { Account } from "@utils/types";
import { ether } from "@utils/index";

import { BaseManager } from "@set/typechain/BaseManager";
import { BaseManager__factory } from "@set/typechain/factories/BaseManager__factory";
import { GIMExtension } from "@set/typechain/GIMExtension";
import { GIMExtension__factory } from "@set/typechain/factories/GIMExtension__factory";
import { GovernanceAdapter } from "@set/typechain/GovernanceAdapter";
import { GovernanceAdapter__factory } from "@set/typechain/factories/GovernanceAdapter__factory";
import { StreamingFeeSplitExtension } from "@set/typechain/StreamingFeeSplitExtension";
import { StreamingFeeSplitExtension__factory } from "@set/typechain/factories/StreamingFeeSplitExtension__factory";

import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";
import {
  findDependency,
  getContractAddress,
  DEPENDENCY,
} from "@deployments/utils";

const {
  GENERAL_INDEX_MODULE,
  GOVERNANCE_MODULE,
  STREAMING_FEE_MODULE,
} = DEPENDENCY;


const expect = getWaffleExpect();

describe("DPI: New Manager System", () => {
  let deployer: Account;

  let baseManagerInstance: BaseManager;
  let governanceAdapterInstance: GovernanceAdapter;
  let gimExtensionInstance: GIMExtension;
  let feeExtensionInstance: StreamingFeeSplitExtension;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedBaseManagerContract = await getContractAddress("BaseManager - DPI");
    baseManagerInstance = new BaseManager__factory(deployer.wallet).attach(deployedBaseManagerContract);

    const deployedGovernanceAdapter = await getContractAddress("GovernanceAdapter - DPI");
    governanceAdapterInstance = new GovernanceAdapter__factory(deployer.wallet).attach(deployedGovernanceAdapter);

    const deployedGIMExtension = await await getContractAddress("GIMExtension - DPI");
    gimExtensionInstance = new GIMExtension__factory(deployer.wallet).attach(deployedGIMExtension);

    const deployedFeeExtension = await await getContractAddress("StreamingFeeSplitExtension - DPI");
    feeExtensionInstance = new StreamingFeeSplitExtension__factory(deployer.wallet).attach(deployedFeeExtension);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("BaseManager", async () => {
    it("should have the correct SetToken address", async () => {
      const setToken = await baseManagerInstance.setToken();

      expect(setToken).to.eq(await findDependency("DPI"));
    });

    it("should have the correct operator address", async () => {
      const operator = await baseManagerInstance.operator();
      expect(operator).to.eq(deployer.address);
    });

    it("should have the correct methodologist address", async () => {
      const methodologist = await baseManagerInstance.methodologist();
      expect(methodologist).to.eq(deployer.address);
    });

    it("should have the correct adapters", async () => {
      const adapters = await baseManagerInstance.getAdapters();
      expect(adapters[0]).to.eq(governanceAdapterInstance.address);
    });
  });

  describe("GovernanceAdapter", async () => {
    it("should have the correct manager address", async () => {
      const manager = await governanceAdapterInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManager - DPI"));
    });

    it("should have the correct GovernanceModule address", async () => {
      const govModule = await governanceAdapterInstance.governanceModule();
      expect(govModule).to.eq(await findDependency(GOVERNANCE_MODULE));
    });
  });

  describe("GIMExtension", async () => {
    it("should have the correct manager address", async () => {
      const manager = await gimExtensionInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManager - DPI"));
    });

    it("should have the correct GeneralIndexModule address", async () => {
      const gimModule = await gimExtensionInstance.generalIndexModule();
      expect(gimModule).to.eq(await findDependency(GENERAL_INDEX_MODULE));
    });
  });

  describe("StreamingFeeSplitExtension", async () => {
    it("should have the correct manager address", async () => {
      const manager = await feeExtensionInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManager - DPI"));
    });

    it("should have the correct StreamingFeeModule address", async () => {
      const feeModule = await feeExtensionInstance.streamingFeeModule();
      expect(feeModule).to.eq(await findDependency(STREAMING_FEE_MODULE));
    });

    it("should have the correct fee split", async () => {
      const feeSplit = await feeExtensionInstance.operatorFeeSplit();
      expect(feeSplit).to.eq(ether(.7));
    });
  });
});