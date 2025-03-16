#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

program
  .name("file-checker")
  .description("Search files using file-checker")
  .version("1.0.0");

program
  .command("check")
  .description("Checks file")
  .option("-f, --file <filename>", "File name to check")
  .action(async (options) => {
    let targetFile = options.file;

    if (!targetFile) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "file",
          message: "Enter file name to search for:",
        },
      ]);
      targetFile = answer.file;
    }

    if (!targetFile) {
      console.log(chalk.red(`❌ No file name provided!`));
      return;
    }

    const projectRoot = process.cwd();
    const foundFiles = [];

    function searchDir(currentPath) {
      let items;
      try {
        items = fs.readdirSync(currentPath);
      } catch (err) {
        console.log(chalk.red(`⚠️ Cannot access ${currentPath}`));
        return;
      }

      items.forEach((item) => {
        const itemPath = path.join(currentPath, item);

        let stats;
        try {
          stats = fs.statSync(itemPath);
        } catch (err) {
          console.log(chalk.red(`⚠️ Cannot read: ${itemPath}`));
          return;
        }

        if (stats.isDirectory()) {
          searchDir(itemPath);
        } else if (item === targetFile) {
          foundFiles.push(itemPath);
        }
      });
    }

    searchDir(projectRoot);

    if (foundFiles.length > 0) {
      console.log(chalk.bgCyanBright(`✅ ${foundFiles.length} file(s) found:\n`));

      const selectedFile = await listFiles(foundFiles);
      if (selectedFile) {
        const content = readFileContent(selectedFile);
        await handleKeywordSearch(content);
      }

    } else {
      console.log(chalk.yellow(`❌ ${targetFile} not found in project.`));
    }
  });

function readFileContent(file) {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch (error) {
    console.log(chalk.bgWhite(chalk.red("Error Reading content:", error)));
    return "";
  }
}

async function listFiles(files) {
  const choices = files.map((file, index) => ({
    name: `${index + 1}. ${file}`,
    value: file,
  }));

  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message: "Select a file to read its content:",
      choices: choices,
    },
  ]);

  return selected;
}

async function handleKeywordSearch(content) {
  while (true) {
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "What do you want to do?",
        choices: ["🔍 Search keyword", "📄 View full file", "❌ Exit"],
      },
    ]);

    if (mode === "❌ Exit") break;

    if (mode === "📄 View full file") {
      console.log(chalk.blue("\n-----------------------------------\n"));
      console.log(chalk.greenBright(content));
      console.log(chalk.blue("\n-----------------------------------\n"));
    } else if (mode === "🔍 Search keyword") {
      const { keyword } = await inquirer.prompt([
        {
          type: "input",
          name: "keyword",
          message: "Enter keyword to search:",
        },
      ]);

      if (keyword.trim() === "") {
        console.log(chalk.yellow("⚠️ No keyword entered."));
        continue;
      }

      const regex = new RegExp(`(${keyword})`, "gi");
      const highlighted = content.replace(
        regex,
        (match) => chalk.bgYellow.black(match)
      );

      console.log(chalk.blue("\n🔍 Keyword Matches Highlighted Below:\n"));
      console.log(highlighted);
      console.log(chalk.blue("\n-----------------------------------\n"));
    }
  }
}

program.parse(process.argv);
