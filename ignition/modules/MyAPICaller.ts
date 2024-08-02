
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyAPICallerModule = buildModule("MyAPICallerModule", (m) => {
  
  const myAPICaller = m.contract("MyAPICaller");

  return { myAPICaller };
});

export default MyAPICallerModule;
