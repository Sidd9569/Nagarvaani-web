#!/bin/bash

# NagarVaani Deployment Script
# This script helps you deploy your application

echo "🚀 NagarVaani Deployment Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo ""
    echo "🔗 Enter your GitHub repository URL:"
    read -p "https://github.com/" REPO_URL
    git remote add origin "https://github.com/$REPO_URL"
fi

echo ""
echo "✅ Git repository is ready!"
echo ""
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Prepare for deployment"
git push -u origin main

echo ""
echo "🎉 Your code is now on GitHub!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Go to https://render.com and sign up/login"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository: $REPO_URL"
echo "4. Configure:"
echo "   - Root Directory: Nagarvaani"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "5. Add environment variables from .env file"
echo "6. Click 'Create Web Service'"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""