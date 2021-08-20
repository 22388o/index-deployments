import "module-alias/register";

import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { Address } from "../../../utils/types";
import {
  Controller,
  StreamingFeeModule,
  SetTokenCreator,
  Controller__factory,
  StreamingFeeModule__factory,
} from "@set/typechain/index";

import DeploySetV2 from "./deploySetV2";

import { ether, ProtocolUtils } from "@utils/common";

import { getRandomAddress } from "@utils/index";

export type ConfiguredSetTokenAddresses = {
  setToken: Address,
  controller: Address,
  streamingFeeModule: Address
};

export default class DeploySetToken {
  private _deployerSigner: Signer;
  private _setV2: DeploySetV2;

  constructor(deployerSigner: Signer) {
    this._deployerSigner = deployerSigner;
    this._setV2 = new DeploySetV2(deployerSigner);
  }

  // Deploys a set token after initializing its modules This is useful if there are post-deployment
  // configuration steps which require a real set token to execute (ex: protectModules)
  public async deployConfiguredSetToken(
    _name: string,
    _symbol: string,
    _controller: Address,
    _module: Address,
  ): Promise<ConfiguredSetTokenAddresses> {
    let controllerInstance: Controller;
    let moduleInstance: StreamingFeeModule;
    let setTokenCreatorInstance: SetTokenCreator;

    controllerInstance = new Controller__factory(this._deployerSigner).attach(_controller);
    moduleInstance = new StreamingFeeModule__factory(this._deployerSigner).attach(_module);

    setTokenCreatorInstance = await this._setV2.deploySetTokenCreator(controllerInstance.address);

    await controllerInstance.initialize(
      [setTokenCreatorInstance.address],  // Factories
      [moduleInstance.address],           // Modules
      [],                                 // Resources
      []
    );

    const tx = await setTokenCreatorInstance.create(
      [await getRandomAddress()],
      [ether(1000000)],
      [moduleInstance.address],
      await this._deployerSigner.getAddress(),
      _name,
      _symbol,
    );

    const setTokenAddress = await new ProtocolUtils(this._deployerSigner.provider as JsonRpcProvider)
      .getCreatedSetTokenAddress(tx.hash);

    const feeSettings = {
      feeRecipient: await this._deployerSigner.getAddress(),
      maxStreamingFeePercentage: ether(.1),
      streamingFeePercentage: ether(.01),
      lastStreamingFeeTimestamp: BigNumber.from(0),
    };

    await moduleInstance.connect(this._deployerSigner).initialize(setTokenAddress, feeSettings);

    return {
      setToken: setTokenAddress,
      streamingFeeModule: moduleInstance.address,
      controller: controllerInstance.address,
    };
  }
}