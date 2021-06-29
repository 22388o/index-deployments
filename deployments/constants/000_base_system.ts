import { BigNumber } from "@ethersproject/bignumber";

import { ONE_DAY_IN_SECONDS, ONE_YEAR_IN_SECONDS } from "@deployments/utils/constants";
import { MERKLE_DISTRIBUTION } from "@deployments/utils/deploys/merkleDistribution";

import { ether } from "@utils/index";
import { parseBalanceMap } from "@deployments/utils";

import { DistributionFormat } from "@utils/types";

export const CONTRACT_NAMES = {
  INDEX_TOKEN: "IndexToken",
  MERKLE_DISTRIBUTOR: "MerkleDistributor",
  VESTING: "Vesting",
  STAKING_REWARDS: "StakingRewards",
  INDEX_METHODOLOGY_TREASURY_VESTING: "IndexMethodologyTreasuryVesting",
  YEAR_ONE_TREASURY_VESTING: "YearOneTreasuryVesting",
  YEAR_TWO_TREASURY_VESTING: "YearTwoTreasuryVesting",
  YEAR_THREE_TREASURY_VESTING: "YearThreeTreasuryVesting",
  YEAR_ONE_SET_LABS_VESTING: "YearOneSetLabsVesting",
  YEAR_TWO_SET_LABS_VESTING: "YearTwoSetLabsVesting",
  YEAR_THREE_SET_LABS_VESTING: "YearThreeSetLabsVesting",
  YEAR_ONE_DFP_VESTING: "YearOneDFPVesting",
  YEAR_TWO_DFP_VESTING: "YearTwoDFPVesting",
  YEAR_THREE_DFP_VESTING: "YearThreeDFPVesting",
};

const distributionArray: DistributionFormat[] = MERKLE_DISTRIBUTION;

export const MERKLE_ROOT_OBJECT = parseBalanceMap(distributionArray); // Merkle root object
export const UNISWAP_LP_REWARD_AMOUNT = ether(900000); // 900k tokens; 9% supply
export const MERKLE_DISTRIBUTOR_AMOUNT = ether(100000); // 100k tokens; 1% supply

export const TREASURY_IMMEDIATE_OWNERSHIP_AMOUNT = ether(500000); // 500k tokens; 5% supply

export const TREASURY_INDEX_METHODOLOGY_OWNERSHIP_AMOUNT = ether(750000); // 750k tokens; 7.5% supply

// Treasury vesting amounts 47.5%
export const TREASURY_YEAR_ONE_OWNERSHIP_AMOUNT = ether(2375000); // 2.375m tokens; 23.75% supply
export const TREASURY_YEAR_TWO_OWNERSHIP_AMOUNT = ether(1425000); // 1.425m tokens; 14.25% supply
export const TREASURY_YEAR_THREE_OWNERSHIP_AMOUNT = ether(950000); // 950k tokens; 9.5% supply

// Set Labs vesting amounts 28%
export const SET_LABS_YEAR_ONE_OWNERSHIP_AMOUNT = ether(1400000); // 1.4m tokens; 14% supply
export const SET_LABS_YEAR_TWO_OWNERSHIP_AMOUNT = ether(840000); // 840k tokens; 8.4% supply
export const SET_LABS_YEAR_THREE_OWNERSHIP_AMOUNT = ether(560000); // 560k tokens; 5.6% supply

// DeFi Pulse vesting amounts 2%
export const DFP_YEAR_ONE_OWNERSHIP_AMOUNT = ether(100000); // 100k tokens; 1% supply
export const DFP_YEAR_TWO_OWNERSHIP_AMOUNT = ether(60000); // 60k tokens; 0.6% supply
export const DFP_YEAR_THREE_OWNERSHIP_AMOUNT = ether(40000); // 40k tokens; 0.4% supply

// Vesting parameters
const anchorTime = BigNumber.from(Math.floor(Date.now() / 1000)).add(120);
export const VESTING_TIMES: { [networkId: string]: any } = {
  vestingIndexMethodologyBegin: {
    production: BigNumber.from(1607281200),                   // 12/06/2020 @ 7:00pm UTC
    staging: BigNumber.from(1607281200),
    development: anchorTime.add(ONE_DAY_IN_SECONDS.mul(60)),
  },
  vestingIndexMethodologyCliff: {
    production: BigNumber.from(1607281200),                   // 12/06/2020 @ 7:00pm UTC
    staging: BigNumber.from(1607281200),
    development: anchorTime.add(ONE_DAY_IN_SECONDS.mul(60)),
  },
  vestingIndexMethodologyEnd: {
    production: BigNumber.from(1653937200),                   // 5/30/2022 @ 7:00pm UTC
    staging: BigNumber.from(1653937200),
    development: anchorTime.add(ONE_DAY_IN_SECONDS.mul(600)),
  },
  vestingYearOneBegin: {
    production: BigNumber.from(1602010800),                   // 10/6/2020 Tuesday 12PM PST
    staging: BigNumber.from(1602010800),
    development: anchorTime,
  },
  vestingYearOneCliff: {
    production: BigNumber.from(1602010800),                   // 10/6/2020 Tuesday 12PM PST
    staging: BigNumber.from(1602010800),
    development: anchorTime,
  },
  vestingYearOneEnd: {
    production: BigNumber.from(1633546800),                   // 10/6/2021
    staging: BigNumber.from(1633546800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS),
  },
  vestingYearTwoBegin: {
    production: BigNumber.from(1633546800),                   // 10/6/2021
    staging: BigNumber.from(1633546800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS),
  },
  vestingYearTwoCliff: {
    production: BigNumber.from(1633546800),                   // 10/6/2021
    staging: BigNumber.from(1633546800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS),
  },
  vestingYearTwoEnd: {
    production: BigNumber.from(1665082800),                   // 10/6/2022
    staging: BigNumber.from(1665082800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS.mul(2)),
  },
  vestingYearThreeBegin: {
    production: BigNumber.from(1665082800),                   // 10/6/2022
    staging: BigNumber.from(1665082800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS.mul(2)),
  },
  vestingYearThreeCliff: {
    production: BigNumber.from(1665082800),                   // 10/6/2022
    staging: BigNumber.from(1665082800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS.mul(2)),
  },
  vestingYearThreeEnd: {
    production: BigNumber.from(1696618800),                   // 10/6/2023
    staging: BigNumber.from(1696618800),
    development: anchorTime.add(ONE_YEAR_IN_SECONDS.mul(3)),
  },
};