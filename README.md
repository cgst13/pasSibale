# Getting Started with Phoenix-React

Welcome to the ReactJS version of the original Phoenix theme. This document will guide you on how the Phoenix-React theme is organized, the basics of customization, and how to compile it from the source code if needed.

## Running in Local Environment

This project is scaffolded using Vite.

- Install Node.js if you do not already have it installed on your machine.
- Open the “phoenix-react-{version}” directory with your cmd or terminal and run npm i
- This command will download all the necessary dependencies for phoenix in the node_modules directory.
- Run npm run dev. A local web server will start at http://localhost:5001.

## Creating a Production Build

After you've done your customization and are ready to build, follow these steps:

- Edit homepage in your package.json file to change asset files relative paths. For more information, visit Vite Doc.
- Then Run npm run build command in your project directory to make the Production build.

This will create an optimized production build by compiling, merging, and minifying all the source files as necessary and will put them in the build/ folder.

To run the production build locally, run the following commands:

```shell
 npm run preview
```
