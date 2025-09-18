#!/bin/bash
# Add Centsible shortcuts to your shell

echo "" >> ~/.zshrc
echo "# Centsible shortcuts" >> ~/.zshrc
echo "alias centsible='cd ~/Developer/apps/centsible'" >> ~/.zshrc
echo "alias cents='cd ~/Developer/apps/centsible && code .'" >> ~/.zshrc
echo "" >> ~/.zshrc

echo "✅ Aliases added!"
echo "Run: source ~/.zshrc"
echo "Then use: 'centsible' to navigate to project"
