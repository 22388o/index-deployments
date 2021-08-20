import "module-alias/register";

import {
  BaseExtension,
  BaseExtension__factory,
  BaseManager,
  BaseManager__factory,
  BaseManagerV2,
  BaseManagerV2__factory
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

  public async getBaseManagerV2(icManagerV2Address: Address): Promise<BaseManagerV2> {
    return await new BaseManagerV2__factory(this._deployerSigner).attach(icManagerV2Address);
  }

  public async getExtension(extension: Address): Promise<BaseExtension> {
    return await BaseExtension__factory.connect(extension, this._deployerSigner);
  }
}