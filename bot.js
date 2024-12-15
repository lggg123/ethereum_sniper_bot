const fs = require("fs");
const { WebSocketProvider, Contract, Wallet, parseEther } = require("ethers");
require("dotenv").config();
const blockchain = require("./blockchain.json")

const provider = new WebSocketProvider(process.env.LOCAL_RPC_URL_WS);
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider);
const factory = new Contract(
    blockchain.factoryAddress,
    blockchain.factoryAbi.abi,
    provider
);

const router = new Contract(
    blockchain.routerAddress,
    blockchain.routerAbi.abi,
    wallet
);

const SNIPE_LIST_FILE = "snipeList.csv";
const TOKEN_LIST_FILE = "tokenList.csv";

const init = () => {
    // setup an event listener for new liquidity pool
    factory.on("PairCreated", (token0, token1, pairAddress) => {
        console.log(`
            New pair detected   
            =================
            pairAddress: ${pairAddress}
            token0: ${token0}
            token1: ${token1}
        `);
        // save this info in a file we are putting the liquidity pool in a file
        if (
            token0.toLowerCase() !== blockchain.WETHAddress.toLowerCase() &&
            token1.toLowerCase() !== blockchain.WETHAddress.toLowerCase()
          ) {
            return;
          }
          const t0 = token0.toLowerCase() === blockchain.WETHAddress.toLowerCase() ? token0 : token1;
          const t1 = token0.toLowerCase() === blockchain.WETHAddress.toLowerCase() ? token1 : token0;
          
          // Now it appends properly:
          fs.appendFileSync(SNIPE_LIST_FILE, `${pairAddress},${t0},${t1}\n`);    
    });
};

const snipe = async() => {
    console.log("Snipe loop");
    let snipeList = fs.readFileSync(SNIPE_LIST_FILE);
    snipeList = snipeList
        .toString()
        .split("\n")
        .filter(snipe => snipe !== "");
    if(snipeList.length === 0) return;
    for(const snipe of snipeList) {
        const [pairAddress, wethAddress, tokenAddress] = snipe.split(",");
        console.log(`Trying to snipe ${tokenAddress} on ${pairAddress}`);

        const pair = new Contract(
            pairAddress,
            blockchain.pairAbi.abi,
            wallet
        );

        const totalSupply = await pair.totalSupply(); //LP token or liquidity provider token
        if(totalSupply === 0n) {
            console.log("Pool is empty, snipe cancelled");
            continue;
        }

        // there is some liquidity, let's do our sniping!
        // make sure token has enough WETh or it will fail
        const tokenIn = wethAddress;
        const tokenOut = tokenAddress;

        // We buy 0.1 ETH of new token
        const amountIn = parseEther("0.1");
        const amounts  = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
        // Let's define our price tolerance
        // So this means minimumn I will get 95% of the quote I receive
        const amountOutMin = amounts[1] - amounts[1] * 5n / 100n;
        console.log(`
            Buying new token
            ================
            tokenIn: ${amountIn.toString()} ${tokenIn} {WETH}
            tokenOut: ${amountOut.toString()} ${tokenOut}    
        `);
        const tx = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            [tokenIn, tokenOut],
            blockchain.recipient,
            Date.now() + 1000 * + 60 * 10 // 10 minutes from now
        );
        const receipt = await tx.wait();
        console.log(`Transaction receipt: ${receipt}`);

        // to find the price it was executed in you would have to do tjhis.
        // const balanceWethBefore //weth = new Contract() balanceOf
        // const balanceWethAfter
        // const balanceTokenAfter
        // const price = balanceTokenAfter/ (balanceWethBefore - balanceWethAfter)

        if(receipt.status === "1") {
            //1. add it to list of token bought
            // this isnt the price it was executed in
            fs.appendFileSync(TOKEN_LIST_FILE, `${receipt.blockNumber},${wethAddress},${tokenAddress},${amountOutMin / amountIn}\n`)
            //2. remove it from snipeList
            let lines = fs.readFileSync(SNIPE_LIST_FILE).toString().split("\n");
            lines = lines.filter(line => line !== snipe); // filter out the processed line
            fs.writeFileSync(SNIPE_LIST_FILE, lines.join("\n"));
        }
        
    }
};

const managePosition = async () => {
    //1. Stop Loss
    //2. Take Profit
}

const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const main = async () => {
    console.log("Trading bot starting...");
    init();
    while(true) {
        console.log("Heartbeat");
        await snipe();
        await managePosition();
        await timeout(3000)
    }
}

main();