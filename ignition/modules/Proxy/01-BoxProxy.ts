import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const proxyModule = buildModule("ProxyModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const boxV1 = m.contract("Box");

  const proxy = m.contract("TransparentUpgradeableProxy", [
    boxV1,
    proxyAdminOwner,
    "0x",
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxyAdmin, proxy };
});

const boxModule = buildModule("BoxModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const box = m.contractAt("Box", proxy);

  return { box, proxy, proxyAdmin };
});

module.exports = boxModule;
