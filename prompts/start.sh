#!/bin/bash

# Smart Budget Tracker - Quick Start Script
# This script helps you build the budget tracking app with Claude Code

echo "💰 Smart Budget Tracker with Receipt Scanning"
echo "============================================="
echo ""

PROJECT_DIR="/Users/nicholasmatlock/Downloads/smart-budget-tracker"

# Check if we're in the right directory
if [ "$PWD" != "$PROJECT_DIR" ]; then
    echo "📁 Navigating to project directory..."
    cd "$PROJECT_DIR" 2>/dev/null || {
        echo "❌ Project directory not found. Creating it..."
        mkdir -p "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    }
fi

echo "📍 Current directory: $PWD"
echo ""

# Show options
echo "What would you like to do?"
echo ""
echo "1) Build the app with Claude Code (recommended)"
echo "2) View the project architecture (README.md)"
echo "3) View the Claude Code prompt"
echo "4) Create a basic React app first"
echo "5) Open project in VS Code"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🤖 Starting Claude Code..."
        echo ""
        echo "INSTRUCTIONS:"
        echo "1. Claude Code will open in interactive mode"
        echo "2. Copy the prompt from claude-prompt.txt"
        echo "3. Paste it into Claude Code"
        echo "4. Claude will build your complete budget tracker app!"
        echo ""
        echo "Press Enter to continue..."
        read
        
        # Start Claude Code from project directory
        cd "$PROJECT_DIR"
        claude
        ;;
        
    2)
        echo ""
        echo "📖 Opening project architecture..."
        echo ""
        cat README.md | less
        ;;
        
    3)
        echo ""
        echo "📋 Here's the Claude Code prompt:"
        echo "================================="
        echo ""
        cat claude-prompt.txt
        echo ""
        echo "Copy this entire prompt and paste it into Claude Code!"
        ;;
        
    4)
        echo ""
        echo "⚛️ Creating React TypeScript app..."
        echo "This will take a few minutes..."
        echo ""
        
        # Create React app with TypeScript
        npx create-react-app . --template typescript
        
        echo ""
        echo "📦 Installing additional packages..."
        npm install tesseract.js react-dropzone tailwindcss@latest postcss@latest autoprefixer@latest recharts date-fns uuid @types/uuid
        
        # Initialize Tailwind
        npx tailwindcss init -p
        
        # Update tailwind.config.js
        cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
        
        # Add Tailwind to CSS
        cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF
        
        echo ""
        echo "✅ React app created with all dependencies!"
        echo ""
        echo "Now run: claude < claude-prompt.txt"
        echo "Or use: claude (interactive mode) and paste the prompt"
        ;;
        
    5)
        echo ""
        echo "📝 Opening in VS Code..."
        code .
        ;;
        
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "📚 Resources:"
echo "  • README.md - Project architecture"
echo "  • claude-prompt.txt - Complete prompt for Claude Code"
echo "  • setup-prompt.txt - Original requirements"
echo ""
echo "💡 Tip: Use 'claude' from this directory to build the app!"
