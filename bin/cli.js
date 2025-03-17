#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import os from "os";
import { spawn } from "child_process";

program
  .name("code-lens")
  .description("Search files in large folders using file-checker")
  .version("2.0.0");

program
  .command("edit")
  .description("Edit a file directly from CLI")
  .action(async () => {
    const { fileName } = await inquirer.prompt([
      {
        type: "input",
        name: "fileName",
        message: "Enter file name to edit:",
      },
    ]);

    const foundFiles = await searchDir(process.cwd(), fileName);
    if (foundFiles.length === 0) {
      console.log(chalk.red("❌ File not found."));
      return;
    }

    const selectedFile = await listItems(foundFiles, "Select a file to edit:");

    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "Choose edit mode:",
        choices: [
          "✏️ Inline Edit",
          "📝 Multi-line Edit",
          "➕ Add/Remove Lines",
          "📂 External Editor (nano/vim)",
          "❌ Cancel",
        ],
      },
    ]);

    if (mode === "✏️ Inline Edit") await editFileInline(selectedFile);
    if (mode === "📝 Multi-line Edit") await editMultipleLines(selectedFile);
    if (mode === "➕ Add/Remove Lines") await addRemoveLines(selectedFile);
    if (mode === "📂 External Editor (nano/vim)") await openInExternalEditor(selectedFile);
  });

program
  .command("delete")
  .description("Deletes specified file or folder")
  .action(async () => {
    const { deleteType } = await inquirer.prompt([
      {
        type: "list",
        name: "deleteType",
        message: "What do you want to delete?",
        choices: ["📄 File", "📁 Folder", "❌ Cancel"],
      },
    ]);

    if (deleteType === "❌ Cancel") {
      console.log(chalk.blue("Operation canceled."));
      return;
    }

    if (deleteType === "📁 Folder") {
      const { folderName } = await inquirer.prompt([
        {
          type: "input",
          name: "folderName",
          message: "Enter folder name to delete:",
        },
      ]);

      if (!folderName.trim()) {
        console.log(chalk.red("❌ No folder name provided!"));
        return;
      }

      const foundFolders = await searchForDir(process.cwd(), folderName);
      if (foundFolders.length === 0) {
        console.log(chalk.red("❌ Folder not found."));
        return;
      }

      const selectedFolder = await listItems(foundFolders, "Select a folder to delete:");
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: chalk.yellow(`Are you sure you want to delete this folder?`),
        },
      ]);

      if (confirm) {
        await deleteFolder(selectedFolder);
      } else {
        console.log(chalk.blue("Command Canceled!"));
      }
      return;
    }

    const { fileName } = await inquirer.prompt([
      {
        type: "input",
        name: "fileName",
        message: "Enter file name to delete:",
      },
    ]);

    if (!fileName.trim()) {
      console.log(chalk.red("❌ No file name provided!"));
      return;
    }

    const foundFiles = await searchDir(process.cwd(), fileName);

    if (foundFiles.length > 0) {
      console.log(chalk.bgCyanBright(chalk.black(`✅ ${foundFiles.length} file(s) found!`)));
      const selectedFile = await listItems(foundFiles, "Select a file to delete:");

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: chalk.yellow(`Are you sure you want to delete this file?`),
        },
      ]);

      if (confirm) {
        await deleteFile(selectedFile);
      } else {
        console.log(chalk.blue("Command Canceled!"));
      }
    } else {
      console.log(chalk.yellow(`❌ File '${fileName}' not found.`));
    }
  });

program
  .command("check")
  .description("Searches for file")
  .option("-f, --file <filename>", "File name to check")
  .action(async (options) => {
    let { file: targetFile } = options;

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
    const foundFiles = await searchDir(projectRoot, targetFile);

    if (foundFiles.length > 0) {
      console.log(chalk.bgCyanBright(chalk.black(`✅ ${foundFiles.length} file(s) found:\n`)));

      const selectedFile = await listItems(foundFiles, "Select a file to read its content:");
      if (selectedFile) {
        const content = await readFileContent(selectedFile);
        await handleKeywordSearch(content, selectedFile);
      }
    } else {
      console.log(chalk.yellow(`❌ ${targetFile} not found in project.`));
    }
  });

async function readFileContent(file) {
  try {
    return await fs.readFile(file, "utf-8");
  } catch (error) {
    console.log(chalk.bgWhite(chalk.red("Error reading content:", error)));
    return "";
  }
}

async function searchDir(currentPath, targetFile) {
  let foundFiles = [];
  let items;
  try {
    items = await fs.readdir(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        const nestedFiles = await searchDir(itemPath, targetFile);
        foundFiles = foundFiles.concat(nestedFiles);
      } else if (item === targetFile) {
        foundFiles.push(itemPath);
      }
    }
  } catch (err) {
    console.log(chalk.red(`⚠️ Error accessing ${currentPath}: ${err.message}`));
  }

  return foundFiles;
}

async function searchForDir(currentPath, targetFolder) {
  let foundFolders = [];
  let items;
  try {
    items = await fs.readdir(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        if (item === targetFolder) {
          foundFolders.push(itemPath);
        }
        const nestedFolders = await searchForDir(itemPath, targetFolder);
        foundFolders = foundFolders.concat(nestedFolders);
      }
    }
  } catch (err) {
    console.log(chalk.red(`⚠️ Error accessing ${currentPath}: ${err.message}`));
  }
  return foundFolders;
}

async function listItems(items, message) {
  const choices = items.map((item, index) => ({
    name: `${index + 1}. ${item}`,
    value: item,
  }));

  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message: message,
      choices: choices,
    },
  ]);

  return selected;
}

async function handleKeywordSearch(content, filePath) {
  while (true) {
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "What do you want to do?",
        choices: ["🔍 Search keyword", "📄 View full file", "✏️ Edit a line", "❌ Exit"],
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
      const highlighted = content.replace(regex, (match) => chalk.bgYellow.black(match));

      console.log(chalk.blue("\n🔍 Keyword Matches Highlighted Below:\n"));
      console.log(highlighted);
      console.log(chalk.blue("\n-----------------------------------\n"));
    } else if (mode === "✏️ Edit a line") {
      await editFileInline(filePath);
      content = await readFileContent(filePath); // Update content after edit
    }
  }
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(chalk.green("✅ File Deleted!"));
  } catch (err) {
    console.log(chalk.red(`Error deleting file: ${err.message}`));
  }
}

async function deleteFolder(folderPath) {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(chalk.green("✅ Folder Deleted Successfully!"));
  } catch (err) {
    console.log(chalk.red(`❌ Error deleting folder: ${err.message}`));
  }
}

async function editFileInline(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split(/\r?\n/);

    console.log(chalk.cyan("\n📝 Current File Content:\n"));
    lines.forEach((line, idx) => {
      console.log(`${chalk.gray(String(idx + 1).padStart(3))} | ${line}`);
    });

    const { lineNumber } = await inquirer.prompt([
      {
        type: "input",
        name: "lineNumber",
        message: "Enter line number to edit:",
        validate: (input) => {
          const num = Number(input);
          return num > 0 && num <= lines.length ? true : "Invalid line number!";
        },
      },
    ]);

    const currentLineContent = lines[lineNumber - 1];

    const { newContent } = await inquirer.prompt([
      {
        type: "input",
        name: "newContent",
        message: `Current line: "${currentLineContent}"\nEnter new content to replace this line:`,
      },
    ]);

    lines[lineNumber - 1] = newContent;

    await fs.writeFile(filePath, lines.join("\n"));
    console.log(chalk.green("✅ File updated successfully!"));
  } catch (error) {
    console.log(chalk.red(`❌ Error editing file: ${error.message}`));
  }
}

async function editMultipleLines(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  console.log(chalk.cyan("\n📄 File Content:\n"));
  lines.forEach((line, idx) => {
    console.log(`${chalk.gray(String(idx + 1).padStart(3))} | ${line}`);
  });

  const { startLine, endLine } = await inquirer.prompt([
    {
      type: "input",
      name: "startLine",
      message: "Start line number to edit:",
      validate: (val) =>
        Number(val) > 0 && Number(val) <= lines.length ? true : "Invalid line number",
    },
    {
      type: "input",
      name: "endLine",
      message: "End line number to edit:",
      validate: (val) =>
        Number(val) > 0 && Number(val) <= lines.length ? true : "Invalid line number",
    },
  ]);

  const start = Number(startLine) - 1;
  const end = Number(endLine);

  const { newContent } = await inquirer.prompt([
    {
      type: "editor",
      name: "newContent",
      message: "Enter new content (this will replace selected lines):",
    },
  ]);

  const newLines = newContent.split(/\r?\n/);
  lines.splice(start, end - start, ...newLines);

  await fs.writeFile(filePath, lines.join("\n"), "utf-8");
  console.log(chalk.green("✅ File updated successfully!"));
}

async function addRemoveLines(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const { operation } = await inquirer.prompt([
    {
      type: "list",
      name: "operation",
      message: "Choose operation:",
      choices: ["➕ Add Line", "➖ Remove Line"],
    },
  ]);

  if (operation === "➕ Add Line") {
    const { lineIndex, newLine } = await inquirer.prompt([
      {
        type: "input",
        name: "lineIndex",
        message: "Line number to insert at:",
        validate: (val) => Number(val) >= 0 && Number(val) <= lines.length,
      },
      {
        type: "input",
        name: "newLine",
        message: "Enter new line content:",
      },
    ]);
    lines.splice(Number(lineIndex), 0, newLine);
  } else {
    const { removeIndex } = await inquirer.prompt([
      {
        type: "input",
        name: "removeIndex",
        message: "Line number to remove:",
        validate: (val) => Number(val) > 0 && Number(val) <= lines.length,
      },
    ]);
    lines.splice(removeIndex - 1, 1);
  }

  await fs.writeFile(filePath, lines.join("\n"), "utf-8");
  console.log(chalk.green("✅ File updated successfully!"));
}

async function openInExternalEditor(filePath) {
  const { chosenEditor } = await inquirer.prompt([
    {
      type: "list",
      name: "chosenEditor",
      message: "Choose external editor:",
      choices:
        os.platform() === "win32"
          ? ["Notepad", "VS Code", "Custom"]
          : ["Nano", "Vim", "VS Code", "Custom"],
    },
  ]);

  let command = "";
  if (chosenEditor === "Notepad") command = "notepad";
  else if (chosenEditor === "VS Code") command = "code";
  else if (chosenEditor === "Nano") command = "nano";
  else if (chosenEditor === "Vim") command = "vim";
  else {
    const { customEditor } = await inquirer.prompt([
      {
        type: "input",
        name: "customEditor",
        message: "Enter editor command (e.g., subl, gedit, kate, etc.):",
      },
    ]);
    command = customEditor;
  }

  const child = spawn(command, [filePath], {
    stdio: "inherit",
    shell: true,
  });
}

program.parse(process.argv);