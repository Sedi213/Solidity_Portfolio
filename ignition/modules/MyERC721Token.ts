
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyTokenModule = buildModule("MyTokenModule", (m) => {
  
  const myToken = m.contract("MyToken");

  return { myToken };
});

export default MyTokenModule;
