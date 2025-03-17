
# 📂 file-checker-test

A powerful Node.js CLI tool to **search, view, edit, and delete files and folders** directly from the terminal.

## 🚀 Features

- 🔍 Search files or folders recursively
- 📄 View full file content
- ✏️ Inline file editing
- 📝 Multi-line editing
- ➕ Add/Remove lines
- 📂 External editor support (nano/vim)
- ❌ Delete files and folders
- 🧠 Keyword search with highlights

## 📦 Installation

```bash
npm install -g file-checker-test
```

## 🛠 Usage

### Check (Search File)
```bash
file-checker-test check
```

### Edit File
```bash
file-checker-test edit
```

### Delete File or Folder
```bash
file-checker-test delete
```

## ✨ Edit Modes

- `Inline Edit`: Edit a single line by number.
- `Multi-line Edit`: Edit multiple lines in one go.
- `Add/Remove Lines`: Add or remove lines from a file.
- `External Editor`: Edit in notepad,vs code,nano or vim.

## 📂 Example

```bash
file-checker-test check --file index.js
file-checker-test edit
file-checker-test delete
```

## 🧑‍💻 Author

Created by **Ali Abdullah**  
Passionate about CLI tools and productivity ✨

---

> Built with Node.js, Commander.js, Inquirer.js, Chalk, and fs module.
