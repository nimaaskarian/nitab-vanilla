function getopt(argv, shortOpts) {
  let options = {}, nonOptions = [];
  let i = 0;

  for (let i = 0; i < argv.length; i++) {
    console.log(i)
    const arg = argv[i];

    if (arg.startsWith("-")) {
      // Short option(s)
      const optName = arg.substring(1);
      if (shortOpts.includes(optName)) {
        const optIndex = shortOpts.indexOf(optName);
        options[optName] = true;
        if (shortOpts[optIndex+1] === ":") {
          const value = argv[i+1];
          if (!value) {
            options[optName] = "";
            i++;
            continue;
          }
          if (!value.startsWith("-")) {
            options[optName] = value;
            i++;
          }
        }
      } else {
        throw new Error("Unknown option: " + arg);
      }
    } else {
      // Not an option
      if (shortOpts[0] === ":")
        nonOptions.push(arg);
    }
  }

  if (shortOpts[0] === ":")
    return { nonOptions, options, args: argv.slice(i) };

  return { options, args: argv.slice(i) };
}

// convert url to standars
function convertUrl(url){
  if (
    !url.match(/^http[s]?:\/\//i) &&
    !url.match(/^((..?)?\/)+.*/i)
  ) {
    return "http://" + url;
  }
  return encodeURI(url);
}
function isUrl (input){
    return (
    /^(https:\/\/)?(http?:\/\/)?localhost:*\w*|^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/g.test(
      input
    ) ||
    /^https?(:\/\/)?(www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)|(https?:\/\/)?(www\.)?(?!ww)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(
      input
    )
  );
}
