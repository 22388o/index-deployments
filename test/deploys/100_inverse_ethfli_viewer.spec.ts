import "module-alias/register";
import { deployments } from "hardhat";

import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";

import { Account } from "@utils/types";
import { DEPENDENCY, findDependency, getContractAddress } from "@deployments/utils";
import { CONTRACT_NAMES } from "../../deployments/constants/100_inverse_ethfli_viewer";
import { FLIRebalanceViewer } from "@set/typechain/FLIRebalanceViewer";
import { FLIRebalanceViewer__factory } from "@set/typechain/factories/FLIRebalanceViewer__factory";

const expect = getWaffleExpect();

const {
  AMM_SPLITTER,
  UNISWAP_V3_QUOTER,
} = DEPENDENCY;

describe("InverseETHFLI Viewer", () => {

  let deployer: Account;
  let ethFLIViewer: FLIRebalanceViewer;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedETHFLIViewer = await getContractAddress(CONTRACT_NAMES.I_ETH_FLI_VIEWER_NAME);
    ethFLIViewer = new FLIRebalanceViewer__factory(deployer.wallet).attach(deployedETHFLIViewer);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("#constructor", async () => {
    it("should set the correct state variables for ETH FLI", async () => {
      expect(await ethFLIViewer.uniswapV2ExchangeName()).to.eq(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      expect(await ethFLIViewer.uniswapV3ExchangeName()).to.eq(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);
      expect(await ethFLIViewer.uniswapV2Router()).to.eq(await findDependency(AMM_SPLITTER));
      expect(await ethFLIViewer.uniswapV3Quoter()).to.eq(await findDependency(UNISWAP_V3_QUOTER));
      expect(await ethFLIViewer.fliStrategyExtension()).to.eq(await findDependency(CONTRACT_NAMES.I_ETH_FLI_STRATEGY_EXTENSION_NAME));
    });
  });
});
