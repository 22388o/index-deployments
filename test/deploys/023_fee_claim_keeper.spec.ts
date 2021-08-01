import "module-alias/register";
import { deployments } from "hardhat";

import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";

import { Account } from "@utils/types";
import { DEPENDENCY, findDependency, getContractAddress } from "@deployments/utils";
import { CONTRACT_NAMES } from "../../deployments/constants/023_fee_claim_keeper";
import { FeeClaimKeeper } from "@set/typechain/FeeClaimKeeper";
import { FeeClaimKeeper__factory } from "@set/typechain/factories/FeeClaimKeeper__factory";

const expect = getWaffleExpect();

const { CHAINLINK_GAS } = DEPENDENCY;

describe("FeeClaimKeeper", () => {

  let deployer: Account;
  let feeClaimKeeper: FeeClaimKeeper;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedFeeClaimKeeper = await getContractAddress(CONTRACT_NAMES.FEE_CLAIM_KEEPER);
    feeClaimKeeper = new FeeClaimKeeper__factory(deployer.wallet).attach(deployedFeeClaimKeeper);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("#constructor", async () => {
    it("should set the correct state variables for FeeClaimKeeper", async () => {
      expect(await feeClaimKeeper.gasPriceFeed()).to.eq(await findDependency(CHAINLINK_GAS));
    });
  });
});
