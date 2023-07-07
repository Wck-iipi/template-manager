const inquirer = require("inquirer");
const TreePrompt = require("inquirer-tree-prompt");

const templates = require("./templates.json");

inquirer.registerPrompt("tree", TreePrompt);
inquirer.prompt(templates).then((answers) => {
  //answers is in JSON
});
