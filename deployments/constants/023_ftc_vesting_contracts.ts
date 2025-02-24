import { ether } from "@utils/common";

export const CONTRACT_NAMES = {
  INDEX_TOKEN: "IndexToken",
  FTC_VESTING: "FTCVesting",
};

export const FTC_DETAILS = [
  {
    address: "0x026FD30023D9199450883B3c7f82b7C9ebbEB2F7", // b
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1615575600, // Mar 12 2021
    vestingCliff: 1631469600, // Sep 12 2021
    vestingEnd: 1678644000, // Mar 12 2023
  },
  {
    address: "0x28A4E12c38f052A4D9FaaF17914ff6363AE97DF4", // l
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1614538800, // Feb 28 2021
    vestingCliff: 1630173600, // Aug 28 2021
    vestingEnd: 1677610800, // Feb 28 2023
  },
  {
    address: "0x5CD4EF55C339ef01f79f494c0a568df90699Aa22", // v
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1614538800, // Feb 28 2021
    vestingCliff: 1630173600, // Aug 28 2021
    vestingEnd: 1677610800, // Feb 28 2023
  },
  {
    address: "0x0C1A7BD2A5afb4884bA2dD89B4f7F571553Cda13", // d
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1614538800, // Feb 28 2021
    vestingCliff: 1630173600, // Aug 28 2021
    vestingEnd: 1677610800, // Feb 28 2023
  },
  {
    address: "0x99b5Fb37B04C966dCaF1EDB5eA27B08644Cc4d08", // j
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1626926400, // Jul 22 2021
    vestingCliff: 1642827600, // Jan 22 2022
    vestingEnd: 1689998400, // Jul 22 2023
  },
  {
    address: "0xC99ab7Ffa5a4CB9a06Ee68652fE74B6C59c67284", // n
    vestingAmount: ether(15000), // 15000 INDEX
    vestingStart: 1626494400, // Jul 17 2021
    vestingCliff: 1642395600, // Jan 17 2022
    vestingEnd: 1689566400, // Jul 17 2023
  },
];
