import { ether } from "@utils/index";

export const CONTRACT_NAMES = {
  BASE_MANAGER_NAME: "BaseManagerV2 - DPI",
  GOVERNANCE_EXTENSION_NAME: "GovernanceExtension - DPI",
  GIM_EXTENSION_NAME: "GIMExtension - DPI",
  FEE_EXTENSION_NAME: "StreamingFeeSplitExtension - DPI",
};

export const FEE_SPLIT_ADAPTER = {
  FEE_SPLIT: ether(.7),                       // 70% operator, 30% methodologist fee split
};
