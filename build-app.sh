#!/bin/bash

# Fixed script for Claude Code - Budget Tracker
# This version handles the raw mode error

echo "💰 Building Smart Budget Tracker App"
echo "===================================="
echo ""

# Navigate to project directory
PROJECT_DIR="$HOME/Downloads/smart-budget-tracker"
cd "$PROJECT_DIR" || exit

echo "📁 Working in: $PROJECT_DIR"
echo ""

# Create a simpler prompt for --print mode
cat > simple-prompt.txt << 'EOF'
Create a React TypeScript budget tracking app with these features:
1. Upload receipt images and use Tesseract.js for OCR to extract amounts
2. Auto-categorize expenses (Groceries, Shopping, Utilities, etc.)
3. Track budgets by category with visual progress bars
4. Store data in LocalStorage
5. Include components: Dashboard, ReceiptUploader, TransactionList, BudgetCategories
Use Tailwind CSS for styling. Make it a complete working application.
EOF

echo "Choose how to run Claude Code:"
echo ""
echo "1) Open Terminal and run interactively (RECOMMENDED)"
echo "2) Try print mode (limited interactivity)"
echo "3) View setup instructions"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📝 Instructions for interactive mode:"
        echo "======================================"
        echo ""
        echo "1. Open a NEW Terminal window (Cmd+Space, type Terminal)"
        echo ""
        echo "2. Run these commands:"
        echo ""
        echo "   cd ~/Downloads/smart-budget-tracker"
        echo "   claude"
        echo ""
        echo "3. When Claude starts, paste this prompt:"
        echo ""
        cat claude-prompt.txt
        echo ""
        echo "Press Enter to continue..."
        read
        ;;
        
    2)
        echo ""
        echo "🤖 Attempting print mode..."
        echo "(Note: This may have limited functionality)"
        echo ""
        
        # Try using print mode which doesn't need raw mode
        cat simple-prompt.txt | claude --print
        ;;
        
    3)
        echo ""
        echo "📚 Manual Setup Instructions:"
        echo "=============================="
        echo ""
        echo "Since Claude Code needs an interactive terminal, please:"
        echo ""
        echo "1. Open Terminal app (not through this script)"
        echo "2. Navigate to project: cd ~/Downloads/smart-budget-tracker"
        echo "3. Start Claude: claude"
        echo "4. Copy the prompt from: claude-prompt.txt"
        echo "5. Paste it into Claude"
        echo ""
        echo "The full prompt is saved in: claude-prompt.txt"
        echo "Architecture details are in: README.md"
        ;;
esac
