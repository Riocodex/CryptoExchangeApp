
const qs = require('qs');

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init(){
  await listAvailableTokens();
}

async function listAvailableTokens(){
  console.log("initializing");
  let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
  let tokenListJSON = await response.json();
  console.log("listing available tokens");
  console.log(tokenListJSON);
  tokens = tokenListJSON.tokens
  console.log("tokens:", tokens);

  // create token list for modal
  let parent = document.getElementById("token_list");
  for (const i in tokens){
    // token row in the modal token list
    let div = document.createElement("div");
    div.className = "token_row";
    let html = `
    <img class="token_list_img" src="${tokens[i].logoURI}">
      <span class="token_list_text">${tokens[i].symbol}</span>
      `;
    div.innerHTML = html;
    div.onclick = () => {
      selectToken(tokens[i]);
    };
    parent.appendChild(div);
  }
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log("currentTrade:" , currentTrade);
  renderInterface();
}

function renderInterface(){
  if (currentTrade.from) {
    console.log(currentTrade.from)
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }

}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
          console.log("connecting");
          await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
          console.log(error);
        }
        document.getElementById("login_button").innerHTML = "Connected";
        // const accounts = await ethereum.request({ method: "eth_accounts" });
        document.getElementById("swap_button").disabled = false;
      } else {
        document.getElementById("login_button").innerHTML =
          "Please install MetaMask";
      }
    }

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
  document.getElementById("token_modal").style.display = "none";
}

async function getPrice(){
  console.log("Getting Price");

  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
  }

  // Fetch the swap price.
  const response = await fetch(
    `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );
  
  swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);
  
  document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
  openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;


// Function to get a quote using /swap/v1/quote. We will pass in the user's MetaMask account to use as the takerAddress
async function getQuote(account){
    console.log("Getting Quote");
  
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
  
    const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
      // Set takerAddress to account 
      takerAddress: account,
    }
  
    // Fetch the swap quote.
    const response = await fetch(
      `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
      );
    
    swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);
    
    document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;
  
    return swapQuoteJSON;
  }

  async  function  trySwap(){
    // The address, if any, of the most recently used account that the caller is permitted to access
    let accounts = await ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    // Log the the most recently used address in our MetaMask wallet
    console.log("takerAddress: ", takerAddress);
      // Pass this as the account param into getQuote() we built out earlier. This will return a JSON object trade order. 
  const  swapQuoteJSON = await  getQuote(takerAddress);
  }