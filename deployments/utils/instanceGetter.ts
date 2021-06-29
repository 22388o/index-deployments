import "module-alias/register";

import {
  BaseAdapter,
  BaseAdapter__factory,
  BaseManager,
  BaseManager__factory
} from "@set/typechain/index";

import { Signer } from "ethers";

import { Address } from "@utils/types";

export class InstanceGetter {
  private _deployerSigner: Signer;

  constructor(deployerSigner: Signer) {
    this._deployerSigner = deployerSigner;
  }

  public async getBaseManager(icManagerV2Address: Address): Promise<BaseManager> {
    return await new BaseManager__factory(this._deployerSigner).attach(icManagerV2Address);
  }

  public async getExtension(extension: Address): Promise<BaseAdapter> {
    return await BaseAdapter__factory.connect(extension, this._deployerSigner);
  }
}