const inputElement = document.querySelector("#input input");
const historyContainer = document.querySelector("#history-container");
const formElement = document.querySelector("#input form");
const promptA = document.querySelector("#input #prompt-a");
const SPACE = encodeURI(" ");

let aliases = {};
let $ = {
  NAME: "name",
  HOSTNAME: "hostname",
};
let binaries = {
  alias: (arguments)=> {
    arguments.forEach(arg => {
      const [ aliasName, ...aliasUrl] = arg.split("=");
      aliases[aliasName] = aliasUrl.join("=").replace(/"/g, "");
    });
  },
  clear: ()=>{
    historyContainer.innerHTML = "";
  },
  go: (arguments)=>{
    let output = [];
    arguments.forEach(arg => {
      output.push(convertUrl(arg));
    });
    if (output.length > 1)
      output.forEach(url => {
        open(url);
      });
    
    if (arguments.includes("-o"))
      open(output[0])
    else
      window.location.href = output[0];
  },
  echo: (arguments)=> {
    const echoElement = document.createElement("div");
    if (Array.isArray(arguments))
      echoElement.innerHTML=arguments.join(" ");
    else 
      echoElement.innerHTML=arguments

    historyContainer.appendChild(echoElement)
  }
}
inputElement.focus();
formElement.addEventListener("submit",(ev)=>{
  ev.preventDefault();
  const historyElement = document.createElement("div");
  historyElement.className = "history";
  historyElement.innerHTML = "$ " + inputElement.value;
  historyContainer.appendChild(historyElement);

  const runOutput = readAndRunLine(inputElement.value);
  console.log(runOutput)
  
  if (!runOutput)
    binaries.echo("nitab: command not found: "+inputElement.value)

  inputElement.value = "";
  // window.open()
})

// read config file
async function main() {
  const configText = await fetch(".nitabrc").then(r=>r.text());
  configText.split("\n").forEach(line => {
    readAndRunLine(line.trim());
  });
  console.log($);
  console.log(aliases);
  promptA.innerHTML = `[${$.NAME}@${$.HOSTNAME} ~]$ `;
}

function readAndRunLine(line) {

  const [cmd ,...args] = splitArguments(line);
  if (binaries[cmd]) {
    return binaries[cmd](args)||true;
  }
  if (aliases[cmd]) {
    return parseAlias(aliases[cmd],args);
  }

  if (line.split("=").length == 2) {
    const [variableName, ...variableContent] = line.split("=");
    return $[variableName] = variableContent.join("=").replace(/"/g, "");
  }
}

function parseAlias(alias,args) {
  const [cmd, ...innerArgs] = splitArguments(alias);
  if (binaries[cmd]) {
    return binaries[cmd]([ ...innerArgs,...args ])
  }
  if (aliases[cmd]) {
    if (args.length)
      return parseAlias(aliases[cmd],innerArgs)+SPACE+args.join(SPACE);
    
    return parseAlias(aliases[cmd], innerArgs)
  }
  return [cmd, ...innerArgs].join(SPACE)+args.join(SPACE);
}

function splitArguments(line) {
  let arguments = [];
  let firstQuote, nextQuote, firstSpace;
  do {
    firstSpace = line.search(/(?<!\\)\s/);
    firstQuote = line.search(/(?<!\\)"/);
    if (firstSpace == -1) {
      arguments.push(line);
      line = "";
      continue;
    }
    nextQuote = line.substring(firstQuote+1).search(/(?<!\\)"/)+firstQuote+1;
    if (firstSpace > firstQuote && firstSpace < nextQuote) {
      arguments.push(line.substring(0,nextQuote+1))
      line=line.substring(nextQuote+1)
      continue;
    }
    if (firstSpace > 0) {
      arguments.push(line.substring(0,firstSpace));
      line=line.substring(firstSpace+1);
      continue;
    }
    if (firstQuote !== -1) {
      if (firstQuote+1 < nextQuote)
        arguments.push(line.substring(firstQuote+1, nextQuote));
      line=line.substring(0,firstQuote)+line.substring(nextQuote+1);
      continue;
    }

  }
  while (line.length);
  return arguments;
}

// convert url to standars
function convertUrl(url){
  if (
    !url.match(/^http[s]?:\/\//i) &&
    !url.match(/^((..?)?\/)+.*/i)
  ) {
    return "http://" + url;
  }
  return url;
}

function getopt(args, optstring) {
  let optname, optarg;
  optstring.forEach(optchar => {
    if (optchar !== ':')
      optname = optchar;

    if (!optname)
  });
}

main();
