const inputElement = document.querySelector("#input input");
const historyContainer = document.querySelector("#history-container");
const formElement = document.querySelector("#input form");
const promptA = document.querySelector("#input #prompt-a");
const SPACE = encodeURI(" ");

let aliases = {};
let functions = {};
let $ = {
  NAME: "name",
  HOSTNAME: "hostname",
};
let binaries = {
  alias: (arguments)=> {
    arguments.forEach(arg => {
      const [ aliasName, ...aliasUrl] = arg.split("=");
      aliases[aliasName] = aliasUrl.join("=");
    });
  },
  isUrl: (arguments)=> {
    return isUrl(arguments.join(" "))
  },
  function: (arguments, lines)=>{
    const name = arguments[0].split("(")[0]
    let isIf,ifCondition = "";
    let isElse;
    functions[name] = (args)=>{
      return lines.forEach(e=>{
        const argIndex = e.search(/\$\d/);
        e = e.replace(/\$@/,args.join(" "));
        [cmd] = splitArguments(e);
        console.log(cmd)
        if (cmd === "if") {
          isIf = true;
          ifCondition = e.substring(e.indexOf("[")+1, e.indexOf("]")).trim();
          [ifCmd,...ifArgs] = splitArguments(ifCondition);
          if (binaries[ifCmd]) {
            ifCondition = binaries[ifCmd](args);
          }
          return; 
        }
        if (cmd === "fi" && (isIf || isElse)) {
          isIf = false;
          isElse = false;
          ifCondition = "";
          return; 
        }       
        if (cmd === "else" && isIf) {
          isElse = true;
          isIf = false;
          return; 
        }        
        if (isElse && ifCondition) return;
        if (isIf && !ifCondition) return ;

        if (argIndex !== -1) {
          e = e.replace(/\$\d/g, args[e[argIndex+1]-1]||"");
        }

        readAndRunLine({lineString: e});
      })
    }
  },
  clear: ()=>{
    historyContainer.innerHTML = "";
  },
  go: (arguments)=>{
    const {nonOptions, options} = getopt(arguments, ":oa:e");
    let output = [];
    nonOptions.forEach(arg => {
      const url = arg+( options.a||"" );
      if (options.e)
        output.push(url);
      else
        output.push(convertUrl(url));
    });
    if (output.length > 1 || options.o) {
      output.forEach(url => {
        open(url);
      });
    }
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

  const runOutput = readAndRunLine({lineString: inputElement.value});
  console.log(runOutput)
  
  inputElement.value = "";
  // window.open()
})

// read config file
async function main() {
  const configTextLines = (await fetch(".nitabrc").then(r=>r.text())).split('\n');
  let object = {
    lineIndex: 0,
    allLines: configTextLines,
  }
  for (; object.lineIndex < configTextLines.length; object.lineIndex++) {
    readAndRunLine(object);
  }
  promptA.innerHTML = `[${$.NAME}@${$.HOSTNAME} ~]$ `;
}

function readAndRunLine(obj) {
  const line = obj.lineString||obj.allLines[obj.lineIndex];
  // # is comment
  if (line.startsWith("#")) return;

  const [cmd ,...args] = splitArguments(line);

  if (binaries[cmd]) {
    if (cmd === "function"){
      const lines = [];
      let currentLine;
      do {
        currentLine = obj.allLines[++obj.lineIndex];
        if (currentLine.trim().startsWith("#")) continue;

        if (!currentLine.includes("}"))
          lines.push(currentLine.trim());
      }
      while (!currentLine.includes("}"))
      return binaries[cmd](args,lines)||true;
    }
    return binaries[cmd](args)||true;
  }
  if (aliases[cmd]) {
    return parseAlias(aliases[cmd],args)||true;
  }
  if (functions[cmd]) {
    functions[cmd](args);
    return true;
  }

  if (line.split("=").length == 2) {
    const [variableName, ...variableContent] = line.split("=");
    return $[variableName] = variableContent.join("=");
  }
  if (cmd)
    readAndRunLine({lineString: $.DEFAULT?[ $.DEFAULT,cmd,...args ].join(" "):"echo nitab: command not found "+cmd})
}

function parseAlias(alias,args) {
  const [cmd, ...innerArgs] = splitArguments(alias);
  if (binaries[cmd]) {
    return binaries[cmd]([ ...innerArgs,...args ])
  }
  if (aliases[cmd]) {
    if (args.length)
      return parseAlias(aliases[cmd],innerArgs)+" "+args.join(" ");
    
    return parseAlias(aliases[cmd], innerArgs)
  }
  return [cmd, ...innerArgs].join(" ")+args.join(" ");
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
      if (firstQuote === 0)
        arguments.push(line.substring(1,nextQuote))
      else 
        arguments.push(line.substring(0,nextQuote))
      line=line.substring(nextQuote+2)
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
  return arguments.map(arg=>{
    return arg.replace(/(?<!\\)"/g,"").replace(/(?<!\\)\\/g,"").replace(/\\+/g,"\\")
  });
}

// function getopt(args, optstring) {
//   let optname, optarg;
//   optstring.forEach(optchar => {
//     if (optchar !== ':')
//       optname = optchar;

//     if (!optname)
//   });
// }

main();
