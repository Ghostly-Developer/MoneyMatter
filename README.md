# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

## Setup Commands

go install github.com/wailsapp/wails/v2/cmd/wails@latest
wails doctor

wails init -n MoneyMatter -t react-ts

## Commands
- Run UI  
npm run dev
- For UI refersh  
npm install  
npm run build  
cd ..  
wails build -clean  

- wails dev  
- wails build  
- wails build -clean  

## GitHub Pages

Pushes to `POC` build and publish the UI through GitHub Pages. In the repository settings, set
**Pages > Build and deployment > Source** to **GitHub Actions**. Pull requests run the UI build without
publishing a deployment.