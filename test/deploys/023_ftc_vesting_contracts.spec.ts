import "module-alias/register";
import { deployments } from "hardhat";

import { addSnapshotBeforeRestoreAfterEach, getAccounts, getWaffleExpect } from "@utils/index";

import { Account } from "@utils/types";
import { FTCVesting } from "@set/typechain/FTCVesting";
import { getContractAddress } from "@deployments/utils";
import { FTCVesting__factory } from "@set/typechain/factories/FTCVesting__factory";
import { FTC_DETAILS } from "@deployments/constants/023_ftc_vesting_contracts";

const expect = getWaffleExpect();

describe("FtcVesting", () => {
  let deployer: Account;
  let ftcVesting: FTCVesting;

  before(async () => {
    [deployer] = await getAccounts();

    await deployments.fixture();

    const deployedFtcVesting = await getContractAddress("FTCVesting - " + FTC_DETAILS[0].address);
    ftcVesting = new FTCVesting__factory(deployer.wallet).attach(deployedFtcVesting);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("#constructor", async () => {
    it("should set the correct state variables", async () => {
      expect(await ftcVesting.recipient()).to.eq(FTC_DETAILS[0].address);
      expect(await ftcVesting.treasury()).to.eq(deployer.address);
      expect(await ftcVesting.vestingAmount()).to.eq(FTC_DETAILS[0].vestingAmount);
      expect(await ftcVesting.vestingBegin()).to.eq(FTC_DETAILS[0].vestingStart);
      expect(await ftcVesting.vestingEnd()).to.eq(FTC_DETAILS[0].vestingEnd);
      expect(await ftcVesting.vestingCliff()).to.eq(FTC_DETAILS[0].vestingCliff);
      expect(await ftcVesting.lastUpdate()).to.eq(FTC_DETAILS[0].vestingStart);
    });
  });
});
