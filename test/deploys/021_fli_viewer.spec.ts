import "module-alias/register";
import { deployments } from "hardhat";

import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect,
} from "@utils/index";

import { Account } from "@utils/types";
import { DEPENDENCY, findDependency, getContractAddress } from "@deployments/utils";
import { CONTRACT_NAMES } from "../../deployments/constants/021_fli_viewer";
import { FLIRebalanceViewer } from "@set/typechain/FLIRebalanceViewer";
import { FLIRebalanceViewer__factory } from "@set/typechain/factories/FLIRebalanceViewer__factory";

const expect = getWaffleExpect();

const {
  AMM_SPLITTER,
  UNISWAP_V3_QUOTER,
} = DEPENDENCY;

describe("FLIRebalanceViewer", () => {

  let deployer: Account;
  let ethFLIViewer: FLIRebalanceViewer;
  let bctFLIViewer: FLIRebalanceViewer;

  before(async () => {
    [
      deployer,
    ] = await getAccounts();

    await deployments.fixture();

    const deployedETHFLIViewer = await getContractAddress(CONTRACT_NAMES.ETH_FLI_VIEWER_NAME);
    ethFLIViewer = new FLIRebalanceViewer__factory(deployer.wallet).attach(deployedETHFLIViewer);

    const deployedBTCFLIViewer = await getContractAddress(CONTRACT_NAMES.BTC_FLI_VIEWER_NAME);
    bctFLIViewer = new FLIRebalanceViewer__factory(deployer.wallet).attach(deployedBTCFLIViewer);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe("#constructor", async () => {
    it("should set the correct state variables for ETH FLI", async () => {
      expect(await ethFLIViewer.uniswapV2ExchangeName()).to.eq(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      expect(await ethFLIViewer.uniswapV3ExchangeName()).to.eq(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);
      expect(await ethFLIViewer.uniswapV2Router()).to.eq(await findDependency(AMM_SPLITTER));
      expect(await ethFLIViewer.uniswapV3Quoter()).to.eq(await findDependency(UNISWAP_V3_QUOTER));
      expect(await ethFLIViewer.fliStrategyExtension()).to.eq(await findDependency(CONTRACT_NAMES.ETH_FLI_STRATEGY_EXTENSION_NAME));
    });

    it("should set the correct state variables for BTC FLI", async () => {
      expect(await bctFLIViewer.uniswapV2ExchangeName()).to.eq(CONTRACT_NAMES.AMM_SPLITTER_EXCHANGE_ADAPTER);
      expect(await bctFLIViewer.uniswapV3ExchangeName()).to.eq(CONTRACT_NAMES.UNISWAP_V3_EXCHANGE_ADAPTER);
      expect(await bctFLIViewer.uniswapV2Router()).to.eq(await findDependency(AMM_SPLITTER));
      expect(await bctFLIViewer.uniswapV3Quoter()).to.eq(await findDependency(UNISWAP_V3_QUOTER));
      expect(await bctFLIViewer.fliStrategyExtension()).to.eq(await findDependency(CONTRACT_NAMES.BTC_FLI_STRATEGY_EXTENSION_NAME));
    });
  });
});
