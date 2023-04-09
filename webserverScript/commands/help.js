module.exports = {
  errorCheck: (args) => {
    let str = "";
    return str;
  },
  run: (socket, comvars, args) => {

    let str = "";
    if(!args[0]) {
      str = "Commands:\n move\n turn\n help\nType one the following for more help:\n help move\n help turn\n help help";
    } else {
      if(comvars.commandlist.has(args[0])) {
        command = comvars.commandlist.get(args[0]);

        str = `Info regarding ${args[0]}:\nName: ${command.config.name}\n${command.config.description}\nArgument Types (o- is optional): ${command.config.arg_types}`;
      } else {
        str = `${args[0]} is not a valid command!`;
      }
    }

    //The help command uniquely executes IMMEDIATELY, other help commands execute in order
    comvars.helpText += str + "\n\n";
    socket.emit("help", comvars.helpText);
    socket.broadcast.emit("help", comvars.helpText);

  },
  config: {
    name: "help",
    aliases: ["usage", "info"],
    arg_types: ["o-string"],
    description: "Usage: help x\nGives usage of command x, or list of commands if a command name isn't provided"
  }
}