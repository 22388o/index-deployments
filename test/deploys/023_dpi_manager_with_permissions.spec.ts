import "module-alias/register";
import { deployments } from "hardhat";

import { Account } from "@utils/types";
import { ether } from "@utils/index";

import { BaseManagerV2 } from "@set/typechain/BaseManagerV2";
import { BaseManagerV2__factory } from "@set/typechain/factories/BaseManagerV2__factory";
import { GIMExtension } from "@set/typechain/GIMExtension";
import { GIMExtension__factory } from "@set/typechain/factories/GIMExtension__factory";
import { GovernanceExtension } from "@set/typechain/GovernanceExtension";
import { GovernanceExtension__factory } from "@set/typechain/factories/GovernanceExtension__factory";
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
  OPS_MULTI_SIG,
  STREAMING_FEE_MODULE,
  TREASURY_MULTI_SIG,
} = DEPENDENCY;


const expect = getWaffleExpect();

describe("DPI: New Manager System with BaseManagerV2", () => {
  let deployer: Account;

  let baseManagerInstance: BaseManagerV2;
  let governanceExtensionInstance: GovernanceExtension;
  let gimExtensionInstance: GIMExtension;
  let feeExtensionInstance: StreamingFeeSplitExtension;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedBaseManagerContract = await getContractAddress("BaseManagerV2 - DPI");
    baseManagerInstance = new BaseManagerV2__factory(deployer.wallet).attach(deployedBaseManagerContract);

    const deployedGovernanceExtension = await getContractAddress("GovernanceExtension - DPI");
    governanceExtensionInstance = new GovernanceExtension__factory(deployer.wallet).attach(deployedGovernanceExtension);

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
      expect(operator).to.eq(await(findDependency(TREASURY_MULTI_SIG)));
    });

    it("should have the correct methodologist address", async () => {
      const methodologist = await baseManagerInstance.methodologist();
      expect(methodologist).to.eq(deployer.address);
    });

    it("should have the correct extensions", async () => {
      const extensions = await baseManagerInstance.getExtensions();
      expect(extensions.includes(governanceExtensionInstance.address)).to.be.true;
      expect(extensions.includes(gimExtensionInstance.address)).to.be.true;
      expect(extensions.includes(feeExtensionInstance.address)).to.be.true;
    });

    it("should have authorized the feeExtension for the streamingFeeModule", async () => {
      const feeModuleAddress = await await findDependency(STREAMING_FEE_MODULE);
      const isAuthorized = await baseManagerInstance.isAuthorizedExtension(
        feeModuleAddress,
        feeExtensionInstance.address
      );

      expect(isAuthorized).to.be.true;
    });
  });

  describe("GovernanceAdapter", async () => {
    it("should have the correct manager address", async () => {
      const manager = await governanceExtensionInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManagerV2 - DPI"));
    });

    it("should have the correct GovernanceModule address", async () => {
      const govModule = await governanceExtensionInstance.governanceModule();
      expect(govModule).to.eq(await findDependency(GOVERNANCE_MODULE));
    });

    it("should have the OPS_MULTI_SIG added as a caller", async () => {
      const isCaller = await governanceExtensionInstance.callAllowList(await findDependency(OPS_MULTI_SIG));
      expect(isCaller).to.be.true;
    });
  });

  describe("GIMExtension", async () => {
    it("should have the correct manager address", async () => {
      const manager = await gimExtensionInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManagerV2 - DPI"));
    });

    it("should have the correct GeneralIndexModule address", async () => {
      const gimModule = await gimExtensionInstance.generalIndexModule();
      expect(gimModule).to.eq(await findDependency(GENERAL_INDEX_MODULE));
    });
  });

  describe("StreamingFeeSplitExtension", async () => {
    it("should have the correct manager address", async () => {
      const manager = await feeExtensionInstance.manager();
      expect(manager).to.eq(await getContractAddress("BaseManagerV2 - DPI"));
    });

    it("should have the correct StreamingFeeModule address", async () => {
      const feeModule = await feeExtensionInstance.streamingFeeModule();
      expect(feeModule).to.eq(await findDependency(STREAMING_FEE_MODULE));
    });

    it("should have the correct fee split", async () => {
      const feeSplit = await feeExtensionInstance.operatorFeeSplit();
      expect(feeSplit).to.eq(ether(.7));
    });

    // NOTE: This expects operatorFeeRecipient and operator to be the same
    it("should have the correct operator fee recipient", async () => {
      const operatorFeeRecipient = await feeExtensionInstance.operatorFeeRecipient();
      expect(operatorFeeRecipient).to.eq(await findDependency(TREASURY_MULTI_SIG));
    });
  });
});

