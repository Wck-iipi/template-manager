const inquirer = require("inquirer");
const TreePrompt = require("inquirer-tree-prompt");
// const { input } = require("@inquirer/prompts")
const degit = require("degit");


const templates = require("./templates.json");

inquirer.registerPrompt("tree", TreePrompt);
inquirer.prompt(templates).then((templateObject) => {
  inquirer.prompt(
    {
      type: 'input',
      name: 'location',
      message: 'Enter the location of the project: ',
      default() {
        return './'
      }
    }
  ).then((locationObject) => {
    const { template } = templateObject;
    const { location } = locationObject;
    const emitter = degit(template, {
      cache: false,
      force: true,
      verbose: true,
    });

    emitter.on("info", (info) => {
      console.log(info.message);
    });

    emitter.clone(location).then(() => {
      console.log("done");
    });
  })
});
