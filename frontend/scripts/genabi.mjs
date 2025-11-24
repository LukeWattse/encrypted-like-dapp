import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "EncryptedLike";

// <root>/backend
const rel = "../backend";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/backend${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    console.log(`⚠️  Deployment for ${chainName} (chainId: ${chainId}) not found. Skipping...`);
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractFile)) {
    if (!optional) {
      console.error(
        `${line}Contract file '${contractFile}' not found.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    console.log(`⚠️  Contract ${CONTRACT_NAME} not deployed on ${chainName} (chainId: ${chainId}). Skipping...`);
    return undefined;
  }

  try {
    const jsonString = fs.readFileSync(contractFile, "utf-8");
    const obj = JSON.parse(jsonString);
    obj.chainId = chainId;
    console.log(`✓ Found deployment on ${chainName} (chainId: ${chainId}): ${obj.address}`);
    return obj;
  } catch (error) {
    if (!optional) {
      console.error(`${line}Error reading deployment file: ${error.message}${line}`);
      process.exit(1);
    }
    console.log(`⚠️  Error reading deployment for ${chainName}: ${error.message}. Skipping...`);
    return undefined;
  }
}

// Try to read deployments, skip if not found
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true);
const deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);

// Get ABI from any available deployment
let contractABI = null;
if (deployLocalhost) {
  contractABI = deployLocalhost.abi;
} else if (deploySepolia) {
  contractABI = deploySepolia.abi;
} else {
  console.error(
    `${line}No deployments found. Please deploy the contract first:\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network localhost' or 'npx hardhat deploy --network sepolia'${line}`
  );
  process.exit(1);
}

// Verify ABI consistency if both deployments exist
if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Can't use the same ABI on both networks. Consider re-deploying the contracts on both networks.${line}`
    );
    process.exit(1);
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: contractABI }, null, 2)} as const;
\n`;

// Build addresses object dynamically based on available deployments
const addressesEntries = [];
if (deploySepolia) {
  addressesEntries.push(`  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" }`);
}
if (deployLocalhost) {
  addressesEntries.push(`  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" }`);
}

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressesEntries.join(",\n")}
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

