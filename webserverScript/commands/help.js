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
      comvars.commands.forEach(function(value, key) {
        str += "\n " + key;
      });
      str += "\nType one the following for more help:";
      comvars.commands.forEach(function(value, key) {
        str += "\n help " + key;
      });

    } else {

      let command = comvars.commands.get(args[0]) || comvars.commands.get(comvars.aliases.get(args[0]));

      if(!command) {
        str = `${args[0]} is not a valid command!`;
      } else {
        str = `Info regarding ${args[0]}:\nName: ${command.config.name}\n${command.config.description}\nArgument Types: ${command.config.arg_types}`;
      }

    }

    //The help command uniquely executes IMMEDIATELY
    comvars.helpText += str + "\n\n";
    socket.emit("help", comvars.helpText);
    socket.broadcast.emit("help", comvars.helpText);

  }

}
