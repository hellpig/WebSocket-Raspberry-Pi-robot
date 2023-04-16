module.exports = {

  config: {
    name: "help",
    aliases: ["usage", "info"],
    arg_types: ["optional-string"],
    description: "Usage: help x\nGives usage of command x, or list of commands if a command name isn't provided"
  },

  errorCheck: (args) => {
    let str = "";
    return str;
  },

  run: (socket, comvars, args) => {

    let str = "";
    if(!args[0]) {
      str = "Commands:";
      comvars.commandlist.forEach(function(value, key) {
        str += "\n " + key;
      });
      str += "\nType one the following for more help:";
      comvars.commandlist.forEach(function(value, key) {
        str += "\n help " + key;
      });
    } else {

      let aliasArray = [];
      comvars.commandlist.forEach(function(value, key) {
        aliasArray = aliasArray.concat(value.config.aliases);
      });

      let command;
      if(comvars.commandlist.has(args[0])) {

        command = comvars.commandlist.get(args[0]);

        str = `Info regarding ${args[0]}:\nName: ${command.config.name}\n${command.config.description}\nArgument Types: ${command.config.arg_types}`;

      } else if(aliasArray.includes(args[0])) {

        comvars.commandlist.forEach(function(value, key) {
          if(value.config.aliases.includes(args[0])) {
            command = value;
          }
        });

        str = `Info regarding ${args[0]}:\nName: ${command.config.name}\n${command.config.description}\nArgument Types: ${command.config.arg_types}`;

      } else {
        str = `${args[0]} is not a valid command!`;
      }

    }

    //The help command uniquely executes IMMEDIATELY
    comvars.helpText += str + "\n\n";
    socket.emit("help", comvars.helpText);
    socket.broadcast.emit("help", comvars.helpText);

  }

}
