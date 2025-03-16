# code-lens-cli 🔍

A powerful CLI tool to search for files in your project and explore their content interactively.

## Features
- 🔍 Search file across entire project directory
- 📄 View file content in terminal
- ✨ Search and highlight keywords inside files
- 🧠 Interactive prompts using Inquirer
- ⚡ Simple and intuitive terminal interface

## Installation

```bash
npm install -g code-lens-cli
```

# Usage 

1. code-lens check ``[options]``

   ```-f, --file <filename>	Specify the file name to search directly without prompt```

    **e.g** : ```-f or --file <filename>```	Specify the file name to search directly without prompt

<br>

    code-lens check
🔸 Prompts you to enter a file name interactively.
# code-lens check
<li> Enter file name to search for: index.js
✅ 2 file(s) found:

1. /home/user/project/src/index.js
2. /home/user/project/test/index.js

<li> Select a file to read its content:
✔ /home/user/project/src/index.js

<li> Do you want to search for a keyword or view full file?
✔ Search keyword
<br>
✔ Enter keyword to search:
 render
<br>
<br>


# Author 

Ali Abdullah