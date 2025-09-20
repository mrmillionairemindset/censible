import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Privacy: React.FC = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy for Centsible
          </h1>
          <p className="text-gray-600 text-lg">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Effective Date:</strong> January 2024
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* What We Collect */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What Information We Collect
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Email address</strong> - Used for account authentication and login</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Budget and financial data</strong> - Transaction amounts, categories, savings goals, and income information that you manually enter</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>We do NOT collect</strong> - Bank credentials, account numbers, credit card information, or any direct access to your financial accounts</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How We Use Your Data
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Provide budget tracking services</strong> - To display your financial data, generate insights, and help you manage your budget</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Save your data across devices</strong> - To sync your budget information between different devices and browsers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Improve our service</strong> - To understand how the app is used and make improvements (anonymized data only)</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">
                  🔒 We never sell, rent, or share your personal data with third parties for marketing purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Data Storage & Security
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Secure hosting</strong> - Your data is stored securely using Supabase, which provides enterprise-grade security and encryption</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Data encryption</strong> - All data is encrypted in transit and at rest</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Your control</strong> - You can delete your account and all associated data at any time through your account settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Data retention</strong> - We only keep your data as long as your account is active. Deleted accounts are permanently removed within 30 days</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Rights
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">You have the right to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Access your data</strong> - View and export all data associated with your account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Correct your data</strong> - Update or modify any information in your account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Delete your data</strong> - Permanently delete your account and all associated information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Data portability</strong> - Export your data in a readable format</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                If you have any questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">Email:</p>
                <a
                  href="mailto:privacy@centsible.app"
                  className="text-[#27AE60] hover:text-[#219A52] font-medium"
                >
                  privacy@centsible.app
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                We will respond to your inquiry within 48 hours.
              </p>
            </div>
          </section>

          {/* Updates */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Policy Updates
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                We may update this Privacy Policy from time to time. When we do, we will:
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Update the "Effective Date" at the top of this policy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Notify you via email if there are significant changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide a summary of changes for your review</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 Centsible. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;