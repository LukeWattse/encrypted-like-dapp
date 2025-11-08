import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedLike = await deploy("EncryptedLike", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedLike contract: `, deployedEncryptedLike.address);
};
export default func;
func.id = "deploy_encryptedLike"; // id required to prevent reexecution
func.tags = ["EncryptedLike"];

