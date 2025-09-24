# 💰 Centsible - Smart Budget Tracking

> Smart budget tracking that makes cents!

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.0-06B6D4?logo=tailwindcss)
![OCR](https://img.shields.io/badge/OCR-Tesseract.js-FF6B6B)

## ⚠️ Critical: Mandatory Household System

**IMPORTANT:** Every user MUST belong to a household. During signup, users must either:
- **Create a new household** (become the owner)
- **Join an existing household** (with a 6-character invitation code)

See [SIGNUP_FLOW_DOCUMENTATION.md](./SIGNUP_FLOW_DOCUMENTATION.md) for complete details.

## ✨ Features

### 🎯 Core Features
- **📸 Receipt Scanning (CentScan™)** - Upload receipt photos and extract amounts automatically using OCR
- **🤖 Smart Categorization (CentSort™)** - Auto-categorizes expenses (Walmart → Groceries, Shell → Transportation)
- **📊 Interactive Donut Chart** - Visual budget overview with clickable segments for filtering
- **💫 Animated Budget Rings** - Beautiful circular progress indicators for each category
- **📱 Swipeable Transaction Cards** - Swipe left to delete, right to edit transactions
- **🚀 Floating Action Button** - Quick access to scan receipts or add manual entries
- **💾 Local Storage** - Your data stays private on your device

### 🎨 Design & UX
- **Mobile-first responsive design** with touch-friendly interactions
- **Smooth animations** using Framer Motion for premium feel
- **Modern gradient backgrounds** and soft shadows
- **Haptic feedback** support for mobile devices
- **Pull-to-refresh** functionality
- **Safe area insets** for devices with notches

### 💡 Smart Features
- **Merchant Detection** - Recognizes stores and restaurants for auto-categorization
- **Amount Extraction** - Intelligent OCR to find totals from receipts
- **Budget Warnings** - Visual alerts when approaching budget limits
- **Transaction Search** - Find expenses by merchant, category, or description
- **Data Export** - Export transactions to CSV

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **OCR Engine:** Tesseract.js for receipt text recognition
- **Styling:** Tailwind CSS with custom animations
- **Charts:** Recharts for interactive donut chart
- **State Management:** React Context API
- **Animations:** Framer Motion for smooth transitions
- **Storage:** LocalStorage with data persistence
- **UI Components:** Lucide React icons
- **Gestures:** React Swipeable for touch interactions
- **Notifications:** React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd centsible

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## 🎯 Usage Guide

### Adding Expenses
1. **Receipt Scanning**: Click the floating action button (FAB) and select "Quick Scan"
   - Upload a receipt image
   - Review extracted amount and merchant
   - Confirm or edit details

2. **Manual Entry**: Use "Manual Entry" from the FAB
   - Enter amount, description, and merchant
   - Select category (auto-suggests based on merchant)
   - Add optional notes

### Managing Transactions
- **View**: All transactions appear in the right sidebar
- **Edit**: Swipe right on any transaction card
- **Delete**: Swipe left on any transaction card
- **Filter**: Click on donut chart segments to filter by category
- **Search**: Use the search bar to find specific transactions

### Budget Management
- **View Progress**: Each category shows spending vs. allocated budget
- **Visual Indicators**:
  - Green (0-70%): Good standing
  - Yellow (70-90%): On track
  - Red (90%+): Approaching/over budget
- **Interactive Charts**: Click donut segments to filter transactions

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx          # Main dashboard layout
│   │   ├── SpendingDonutChart.tsx # Interactive budget chart
│   │   ├── CategoryCard.tsx       # Category budget display
│   │   └── BudgetRing.tsx         # Animated circular progress
│   ├── Layout/
│   │   └── FloatingActionButton.tsx # Expandable FAB
│   ├── Scanner/
│   │   └── ReceiptUploader.tsx    # OCR receipt processing
│   └── Transactions/
│       ├── TransactionList.tsx    # Transaction management
│       ├── TransactionCard.tsx    # Swipeable transaction item
│       └── QuickExpenseModal.tsx  # Manual expense entry
├── contexts/
│   └── BudgetContext.tsx          # Global state management
├── hooks/
│   └── useOCR.ts                  # OCR processing logic
├── utils/
│   ├── categorizer.ts             # Smart categorization
│   ├── animations.ts              # Animation configs
│   ├── storage.ts                 # LocalStorage utilities
│   └── demoData.ts                # Sample data generator
├── types/
│   └── index.ts                   # TypeScript interfaces
└── App.tsx                        # Main app component
```

## 🎨 Design System

### Colors
- **Primary**: Mint Green (`#10B981`) - Success, completion
- **Secondary**: Dark Slate (`#1E293B`) - Text, borders
- **Accent**: Gold (`#F59E0B`) - Warnings, highlights
- **Background**: Gradient from `#F8FAFC` to `#F1F5F9`

### Typography
- **Headers**: Poppins (600-700 weight)
- **Body**: Inter (400-600 weight)
- **Numbers**: Tabular numerals for alignment

### Animations
- **Page transitions**: 200ms fade
- **Value updates**: Spring animation (stiffness: 300, damping: 30)
- **Progress rings**: 1.5s ease-out with bounce
- **FAB expansion**: Staggered animation with 50ms delay

## 🔧 Development

### Available Scripts
- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App

### Key Features to Extend
- **Cloud Sync**: Add Firebase/Supabase integration
- **Recurring Transactions**: Subscription tracking
- **Insights**: Spending trends and predictions
- **Goals**: Savings and spending targets
- **Multi-Currency**: International support
- **Dark Mode**: Theme switching

## 📱 PWA Features

The app is designed to be PWA-ready:
- Installable on mobile devices
- Offline-capable with service workers
- Native app-like experience
- Push notifications (future feature)

## 🐛 Troubleshooting

### Common Issues
1. **OCR not working**: Ensure image is clear and well-lit
2. **Animations slow**: Try reducing motion in accessibility settings
3. **Storage full**: Export and clear old transactions
4. **Touch issues**: Ensure minimum 44px touch targets

### Browser Support
- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Mobile browsers with touch support

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The app can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT © [Nicholas Matlock]

---

*Making every cent count!* 💰

## 🙏 Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for data visualization