
# 📂 code-lens

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
npm install -g code-lens
```

## 🛠 Usage

### Check (Search File)
```bash
code-lens check
```

### Edit File
```bash
code-lens edit
```

### Delete File or Folder
```bash
code-lens delete
```

## ✨ Edit Modes

- `Inline Edit`: Edit a single line by number.
- `Multi-line Edit`: Edit multiple lines in one go.
- `Add/Remove Lines`: Add or remove lines from a file.
- `External Editor`: Edit in notepad,vs code,nano or vim.

## 📂 Example

```bash
code-lens check --file [filename with extension]
code-lens edit
code-lens delete
```

## 🧑‍💻 Author

Created by **Ali Abdullah**  
Passionate about CLI tools and productivity ✨

---

> Built with Node.js, Commander.js, Inquirer.js, Chalk, and fs module.
