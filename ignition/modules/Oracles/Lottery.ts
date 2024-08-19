import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryModule = buildModule("LotteryModule", (m) => {
  //
  const entranceFeeWei = m.getParameter("entranceFeeWei");
  const weiToParticipate = m.getParameter("weiToParticipate");
  const interval = m.getParameter("interval");
  const vrfCoordinator = m.getParameter("vrfCoordinator");
  const keyHash = m.getParameter("keyHash");
  const subscriptionId = m.getParameter("subscriptionId");
  console.log(entranceFeeWei);

  const lottery = m.contract("Lottery", [
    interval,
    weiToParticipate,
    entranceFeeWei,
    vrfCoordinator,
    keyHash,
    subscriptionId,
  ]);

  return { lottery };
});

export default LotteryModule;
