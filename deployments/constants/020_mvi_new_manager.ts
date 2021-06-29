import { ether } from "@utils/index";

export const CONTRACT_NAMES = {
  BASE_MANAGER_NAME: "BaseManager - MVI",
  GIM_EXTENSION_NAME: "GIMExtension - MVI",
  FEE_EXTENSION_NAME: "StreamingFeeSplitExtension - MVI",
};

export const FEE_SPLIT_ADAPTER = {
  FEE_SPLIT: ether(1),                       // 100% operator, 0% methodologist fee split
};