import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Terms: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome to Censible. These Terms of Service govern your access to and use of our budgeting application and services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Effective Date:</strong> September 25, 2025
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Eligibility */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Eligibility
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>You must be at least 13 years old (or the minimum legal age in your country) to use Censible.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>By using Censible, you represent that you meet these requirements and have the authority to accept these Terms.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Account */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Your Account
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>You are responsible for maintaining the confidentiality of your login information.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>You are responsible for all activities that occur under your account.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Notify us immediately if you suspect unauthorized use of your account.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Acceptable Use
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">You agree <strong>not</strong> to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Use the Service for unlawful or fraudulent purposes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Attempt to gain unauthorized access to the Service or interfere with its functionality.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Share, distribute, or exploit the Service in ways not permitted under these Terms.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Personal Finance Disclaimer */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Personal Finance Disclaimer
            </h2>
            <div className="prose prose-gray max-w-none">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Censible provides budgeting and financial planning tools <strong>for informational purposes only.</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>We do not provide investment, tax, accounting, or legal advice.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>You are solely responsible for any financial decisions you make based on information from the Service.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Subscriptions & Payments */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Subscriptions & Payments
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Some features may require a paid subscription.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Subscription terms, pricing, and renewal conditions will be presented to you at the time of purchase.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>All payments are processed through the app store or third-party payment processors.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Intellectual Property
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>All content, design, software, and trademarks related to Censible are owned by us or our licensors.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>You are granted a limited, non-exclusive, non-transferable license to use the Service for personal purposes only.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>You may not copy, modify, distribute, or reverse-engineer any part of the Service.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Termination
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>We may suspend or terminate your access to the Service if you violate these Terms, misuse the Service, or for any other reason at our discretion.</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Limitation of Liability
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">To the maximum extent permitted by law:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Censible and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Our total liability for any claims relating to the Service shall not exceed the amount you paid us (if any) in the 12 months before the claim.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* No Warranties */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. No Warranties
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>The Service is provided on an <strong>"as is" and "as available" basis</strong> without warranties of any kind, express or implied, including fitness for a particular purpose or non-infringement.</p>
            </div>
          </section>

          {/* Changes to the Terms */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Changes to the Terms
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">We may update these Terms from time to time. If we make material changes, we will notify you via the Service or by other means. Continued use of the Service after updates constitutes acceptance of the new Terms.</p>
            </div>
          </section>

          {/* Governing Law */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Governing Law
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>These Terms shall be governed by and interpreted according to the laws of the United States, without regard to conflict of law principles.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;