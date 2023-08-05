const inquirer = require("inquirer");
const TreePrompt = require("inquirer-tree-prompt");
const degit = require("degit");

const templates = require("./templates.json");

inquirer.registerPrompt("tree", TreePrompt);
inquirer.prompt(templates).then((answers) => {
  const { template } = answers;
  console.log("Running");
  console.log(template);
  const emitter = degit(template, {
    cache: true,
    force: true,
    verbose: true,
  });

  emitter.on("info", (info) => {
    console.log(info.message);
  });

  emitter.clone("temp").then(() => {
    console.log("done");
  });
});
