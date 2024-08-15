import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProxyModule = require("./01-BoxProxy");

const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(ProxyModule);

  const boxV2 = m.contract("BoxV2");

  const encodedFunctionCall = m.encodeFunctionCall(boxV2, "store", [1]);

  m.call(proxyAdmin, "upgradeAndCall", [proxy, boxV2, encodedFunctionCall], {
    from: proxyAdminOwner,
  });

  return { proxyAdmin, proxy };
});

const boxV2Module = buildModule("DemoV2Module", (m) => {
  const { proxy } = m.useModule(upgradeModule);

  const boxV2 = m.contractAt("BoxV2", proxy);

  return { boxV2 };
});

module.exports = boxV2Module;
