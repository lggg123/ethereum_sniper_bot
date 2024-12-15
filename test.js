const { 
    JsonRpcProvider, 
    Wallet,
    ContractFactory,
    Contract,
    parseEther
} = require("ethers");
require("dotenv").config();
const blockchain = require("./blockchain.json");

const provider = new JsonRpcProvider(process.env.LOCAL_RPC_URL_HTTP)
console.log(process.env.LOCAL_RPC_URL_HTTP)
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider)
const erc20Deployer = new ContractFactory(
    blockchain.erc20Abi,
    blockchain.erc20Bytecode,
    wallet
);

const uniswapFactory = new Contract(
    blockchain.factoryAddress,
    blockchain.factoryAbi.abi,
    wallet
);

const main = async () => {
    console.log("main")
    const token = await erc20Deployer.deploy("ABC Token", "ABC", parseEther("1000000000"));
    await token.waitForDeployment();
    console.log(`Test token deployed: ${token.target}`);

    const tx = await uniswapFactory.createPair(blockchain.WETHAddress, token.target);
    const receipt = await tx.wait();
    console.log("Test liquidity pool deployed")

    // Manually exit
    console.log("Done!");
    process.exit(0);
};

main();