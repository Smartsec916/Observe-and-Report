# Instructions for Running Locally After Export

After you've exported the application from Replit and extracted it to your local machine, follow these steps to run it:

## 1. Edit the package.json file

Open the `package.json` file and locate the "scripts" section. Replace the "start" script with:

```json
"scripts": {
  "start": "cross-env NODE_ENV=production node dist/index.js"
}
```

## 2. Install dependencies

Install the dependencies including cross-env:

```bash
npm install
npm install cross-env --save-dev
```

## 3. Run the application

```bash
npm start
```

The application should now be running on http://localhost:5000 (or the port specified in your environment).

## Common Issues

- If you see an error about `cross-env` not being found, make sure you've installed it using `npm install cross-env --save-dev`
- Make sure you've also run `npm install` to install all the required dependencies
- Ensure you have Node.js version 18 or newer installed on your system

## Optional: Build the application before running

If you want to rebuild the application:

```bash
npm run build
npm start
```