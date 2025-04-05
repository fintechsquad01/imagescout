#!/bin/bash

# ImageScout Deployment Script
# This script helps non-technical users deploy the ImageScout application

echo "====================================="
echo "  ImageScout Deployment Assistant"
echo "====================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Version 18 or higher is required."
    echo "Current version: $(node -v)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm from https://nodejs.org/"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from example"
        echo "⚠️ Please edit the .env file to add your API keys"
    else
        echo "❌ .env.example file not found."
        echo "Creating minimal .env file..."
        echo "OPENAI_API_KEY=" > .env
        echo "FALAI_API_KEY=" >> .env
        echo "✅ Created minimal .env file"
        echo "⚠️ Please edit the .env file to add your API keys"
    fi
fi

# Ask for API keys if not present
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo ""
    echo "OpenAI API Key not found or invalid."
    read -p "Enter your OpenAI API Key (starts with 'sk-'): " openai_key
    if [[ $openai_key == sk-* ]]; then
        sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        echo "✅ OpenAI API Key added to .env"
    else
        echo "❌ Invalid API key format. Please edit the .env file manually."
    fi
fi

if ! grep -q "FALAI_API_KEY=" .env || grep -q "FALAI_API_KEY=$" .env; then
    echo ""
    echo "Fal.ai API Key not found."
    read -p "Enter your Fal.ai API Key: " falai_key
    if [ ! -z "$falai_key" ]; then
        sed -i "s/FALAI_API_KEY=.*/FALAI_API_KEY=$falai_key/" .env
        echo "✅ Fal.ai API Key added to .env"
    else
        echo "❌ Empty API key. Please edit the .env file manually."
    fi
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies."
    echo "Please try running 'npm install' manually."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Ask for deployment type
echo ""
echo "How would you like to deploy ImageScout?"
echo "1) Local deployment (easiest, runs on your computer)"
echo "2) Vercel deployment (recommended for production, requires Vercel account)"
read -p "Enter your choice (1 or 2): " deployment_choice

if [ "$deployment_choice" == "1" ]; then
    echo ""
    echo "Starting local deployment..."
    echo "The application will be available at http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop the application when you're done."
    echo ""
    npm run dev
elif [ "$deployment_choice" == "2" ]; then
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo ""
    echo "Starting Vercel deployment..."
    echo "You may be prompted to log in to Vercel if you haven't already."
    echo ""
    vercel
    
    echo ""
    echo "⚠️ Important: You need to set your API keys in the Vercel dashboard."
    echo "1. Go to your Vercel project dashboard"
    echo "2. Navigate to Settings > Environment Variables"
    echo "3. Add OPENAI_API_KEY and FALAI_API_KEY with your API keys"
    echo ""
    echo "After setting the environment variables, redeploy your application."
else
    echo "❌ Invalid choice. Please run the script again and select 1 or 2."
    exit 1
fi

echo ""
echo "Thank you for using ImageScout!"
