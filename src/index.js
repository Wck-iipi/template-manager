const inquirer = require("inquirer");
const fs = require("fs");
const TreePrompt = require("inquirer-tree-prompt");
const degit = require("degit");
const path = require("path");

const templates = require("./templates.json");


//TODO - Add a feature to add template to base of templates.json
//TODO - Remove the unnecessary create a new object and others while deleting and while creating
//TODO - Add bash script support

function writeJSONFile(filename, jsonData) {
  const jsonString = JSON.stringify(jsonData);
  fs.writeFileSync(filename, jsonString);
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
      ])
      .then((templateToBeAddedObject) => {
        inquirer
          .prompt(templates)
          .then((nameWhereTemplateToBeInsertedObject) => {
            const { templateName, templateURL } = templateToBeAddedObject;
            const { template } = nameWhereTemplateToBeInsertedObject;

            if (
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
    inquirer.prompt(templates).then((nameWhereTemplateToBeDeletedObject) => {
      const { template } = nameWhereTemplateToBeDeletedObject;

      if (searchAndDelete(templates.tree, template)) {
        removeChildrenIfEmpty(templates.tree);
        removeEmptyObjectFromChildrenArray(templates.tree);
        templates.tree = templates.tree.filter((item) => JSON.stringify(item) !== "{}");
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
      });
  }
});
