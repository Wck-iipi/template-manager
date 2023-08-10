const inquirer = require("inquirer");
const fs = require("fs");
const TreePrompt = require("inquirer-tree-prompt");
const degit = require("degit");
const path = require("path");
const shell = require("shelljs");
const templates = require("./templates.json");


// 2nd TODO - Run bash script when specific value is chosen

function writeJSONFile(filename, jsonData) {
  const jsonString = JSON.stringify(jsonData);
  fs.writeFileSync(filename, jsonString);
}

function searchAndCheckIfGithub(data, valueToBeFound) {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.value === valueToBeFound) {
        if (item.type === "github") {
          return true;
        } else {
          return false;
        }
      }

      if (
        item.children &&
        searchAndCheckIfGithub(item.children, valueToBeFound)
      ) {
        return true;
      }
    }
  }

  return false;
}

function searchAndInsert(data, valueToBeFound, name, value) {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.value === valueToBeFound) {
        if (!item.children) {
          item.children = [];
        }
        item.children.push({ name, value });
        return true;
      }

      if (
        item.children &&
        searchAndInsert(item.children, valueToBeFound, name, value)
      ) {
        return true;
      }
    }
  }

  return false;
}

function searchAndDelete(data, valueToBeFound) {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.value === valueToBeFound) {
        delete item.value;
        delete item.name;
        delete item.children;
        delete item.type;
        return true;
      }

      if (item.children && searchAndDelete(item.children, valueToBeFound)) {
        return true;
      }
    }
  }

  return false;
}

function removeChildrenIfEmpty(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.children && JSON.stringify(item.children[0]) === "{}") {
        delete item.children;
      }

      if (item.children) {
        removeChildrenIfEmpty(item.children);
      }
    }
  }
}

function removeEmptyObjectFromChildrenArray(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.children) {
        item.children = removeEmptyObjectFromChildrenArray(item.children);
      }
    }
    return data.filter((item) => JSON.stringify(item) !== "{}");
  }
}

inquirer.registerPrompt("tree", TreePrompt);
inquirer.prompt(templates).then((templateObject) => {
  const { template } = templateObject;
  if (template === "newTemplate") {
    var newTemplate = { ...templates };
    newTemplate.tree = newTemplate.tree.filter((element) => {
      return (
        element.value != "newTemplate" && element.value != "deleteTemplate"
      );
    });
    newTemplate.tree.push({
      name: "Add to base",
      value: "addToBase",
    });

    inquirer
      .prompt([
        {
          type: "input",
          name: "templateName",
          message: "Enter the template name: ",
        },
        {
          type: "input",
          name: "templateURL",
          message: "Enter the template URL: ",
        },
        {
          type: "list",
          name: "templateType",
          message: "Bash script or github template?",
          choices: ["bash", "github"],
        },
      ])
      .then((templateToBeAddedObject) => {
        inquirer
          .prompt(newTemplate)
          .then((nameWhereTemplateToBeInsertedObject) => {
            const { templateName, templateURL, templateType } =
              templateToBeAddedObject;
            const { template } = nameWhereTemplateToBeInsertedObject;

            if (template === "addToBase") {
              templates.tree.splice(templates.tree.length - 2, 0, {
                name: templateName,
                value: templateURL,
                type: templateType,
              });
              writeJSONFile(
                path.join(__dirname + "/templates.json"),
                templates
              );
            } else if (
              searchAndInsert(
                templates.tree,
                template,
                templateName,
                templateURL
              )
            ) {
              writeJSONFile(
                path.join(__dirname + "/templates.json"),
                templates
              );
            } else {
              console.log("Name not found in templates.json.");
            }
          });
      });
  } else if (template === "deleteTemplate") {
    var deleteTemplate = { ...templates };
    deleteTemplate.tree = deleteTemplate.tree.filter((element) => {
      return (
        element.value != "newTemplate" && element.value != "deleteTemplate"
      );
    });
    inquirer
      .prompt(deleteTemplate)
      .then((nameWhereTemplateToBeDeletedObject) => {
        const { template } = nameWhereTemplateToBeDeletedObject;

        if (searchAndDelete(templates.tree, template)) {
          removeChildrenIfEmpty(templates.tree);
          removeEmptyObjectFromChildrenArray(templates.tree);
          templates.tree = templates.tree.filter(
            (item) => JSON.stringify(item) !== "{}"
          );
          writeJSONFile(path.join(__dirname + "/templates.json"), templates);
        } else {
          console.log("Name not found in templates.json.");
        }
      });
  } else {
    inquirer
      .prompt({
        type: "input",
        name: "location",
        message: "Enter the location of the project: ",
        default() {
          return "./";
        },
      })
      .then((locationObject) => {
        const { location } = locationObject;

        if (searchAndCheckIfGithub(templates.tree, template)) {
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
            shell.exec("npm install");
          });
        } else {
          // Write run bash script here
          console.log(template, location);
          shell.exec(`bash ${template} ${location}`);
        }
      });
  }
});
