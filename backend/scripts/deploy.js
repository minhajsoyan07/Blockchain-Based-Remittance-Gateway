const hre = require("hardhat");

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    console.log("Deploying RemittancePay contract...");

    const remittancePay = await hre.ethers.deployContract("RemittancePay");

    await remittancePay.waitForDeployment();

    console.log(
        `RemittancePay deployed to ${remittancePay.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
