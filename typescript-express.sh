#!/bin/bash

# Set the project name
PROJECT_NAME="typescript-express-server"

# Create the project directory
mkdir $PROJECT_NAME
cd $PROJECT_NAME

# Initialize a new npm project
npm init -y

# Install the necessary dependencies
npm install express

# Install the necessary dev dependencies
npm install -D typescript @types/node @types/express ts-node nodemon

# Initialize a TypeScript configuration file
npx tsc --init

# Create the project structure
mkdir src
touch src/index.ts

# Populate the index.ts file with a basic Express server
cat <<EOL > src/index.ts
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
EOL

# Configure nodemon for easier development
cat <<EOL > nodemon.json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node ./src/index.ts"
}
EOL

# Add start and dev scripts to package.json
npx npm-add-script -k "start" -v "node dist/index.js"
npx npm-add-script -k "dev" -v "nodemon src/index.ts"

# Create a .gitignore file
cat <<EOL > .gitignore
# Node modules
node_modules/

.env
.env.test
.env.production
.vscode/
EOL

# Compile the TypeScript code
npx tsc

echo "TypeScript Express server setup complete!"
echo "Run 'npm run dev' to start the development server."
echo "Run 'npm start' to start the production server."
