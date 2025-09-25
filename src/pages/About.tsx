import React from 'react';
import { ArrowLeft, Heart, Shield, Users, Target, Mail, ExternalLink } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#27AE60] hover:text-[#219A52] mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#27AE60]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">About Centsible</h1>
              <p className="text-gray-600 text-lg mt-2">Smart budgeting for modern families</p>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Centsible empowers families to take control of their finances through intuitive budgeting tools,
            collaborative household management, and smart insights that make cents of your money.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We believe that financial wellness should be accessible, collaborative, and stress-free. Whether you're
            managing a solo budget or coordinating finances with your entire household, Centsible provides the tools
            and insights you need to achieve your financial goals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Household Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Household Budgeting</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Collaborate with family members on shared budgets. Set permissions, track individual contributions,
              and maintain financial transparency across your household.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multi-member household support</li>
              <li>• Permission-based access control</li>
              <li>• Individual and shared expense tracking</li>
            </ul>
          </div>

          {/* Smart Budgeting */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Smart Budgeting</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Create custom budget categories, set spending limits, and track your progress with real-time insights
              and spending analysis.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Custom budget categories</li>
              <li>• Real-time spending tracking</li>
              <li>• Savings goals and progress monitoring</li>
            </ul>
          </div>

          {/* Security & Privacy */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Security & Privacy</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Your financial data is encrypted and secure. We never connect to your bank accounts - you're in
              complete control of what information you share.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• End-to-end encrypted data</li>
              <li>• No bank account connections required</li>
              <li>• Privacy-first approach</li>
            </ul>
          </div>

          {/* Receipt Scanning */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Receipt Scanning</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Quickly capture expenses by scanning receipts with OCR technology. Premium feature available
              for automatic transaction entry.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• OCR receipt scanning (Premium)</li>
              <li>• Automatic transaction categorization</li>
              <li>• Photo storage and organization</li>
            </ul>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">App Information</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#27AE60] mb-2">v1.0</div>
              <div className="text-sm text-gray-600">Current Version</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#27AE60] mb-2">2025</div>
              <div className="text-sm text-gray-600">Year Launched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#27AE60] mb-2">React</div>
              <div className="text-sm text-gray-600">Built With</div>
            </div>
          </div>
        </div>

        {/* Legal & Links */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal & Support</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/privacy'}
                  className="block text-[#27AE60] hover:text-[#219A52] text-sm"
                >
                  Privacy Policy →
                </button>
                <button
                  onClick={() => window.location.href = '/terms'}
                  className="block text-[#27AE60] hover:text-[#219A52] text-sm"
                >
                  Terms of Service →
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/help'}
                  className="block text-[#27AE60] hover:text-[#219A52] text-sm"
                >
                  Help Center →
                </button>
                <button
                  onClick={() => window.location.href = '/contact'}
                  className="block text-[#27AE60] hover:text-[#219A52] text-sm"
                >
                  Contact Support →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              Have questions, feedback, or need help? We'd love to hear from you.
            </p>
            <div className="flex justify-center items-center gap-2">
              <Mail className="w-5 h-5 text-[#27AE60]" />
              <a
                href="mailto:hello@centsible.app"
                className="text-[#27AE60] hover:text-[#219A52] font-medium"
              >
                hello@centsible.app
              </a>
            </div>
          </div>
        </div>

        {/* Made with Love */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500" /> for better family finances
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;