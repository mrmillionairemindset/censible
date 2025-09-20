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
            Terms of Service for Centsible
          </h1>
          <p className="text-gray-600 text-lg">
            Please read these terms carefully before using our budget tracking application.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Effective Date:</strong> January 2024
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Service Description */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Service Description
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Centsible is a personal budget tracking application designed to help individuals manage their finances,
                track expenses, set savings goals, and monitor income. Our service provides tools for organizing
                financial data, generating insights, and maintaining financial awareness.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                By using Centsible, you acknowledge that this is a personal finance management tool intended for
                individual use and organization of your financial information.
              </p>
            </div>
          </section>

          {/* Important Disclaimers */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Important Disclaimers
            </h2>
            <div className="prose prose-gray max-w-none">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-6">
                <h3 className="text-lg font-bold text-amber-800 mb-3">⚠️ Financial Advice Disclaimer</h3>
                <ul className="space-y-2 text-amber-800">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>This is not professional financial advice.</strong> Centsible is a budgeting tool, not a financial advisory service.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>For personal use only.</strong> The insights and suggestions are based on your data patterns, not professional analysis.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>We are not responsible for financial decisions</strong> you make based on information from this application.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-3">💡 Recommendation</h3>
                <p className="text-blue-800">
                  For professional financial advice, please consult with a qualified financial advisor, accountant,
                  or financial planner who can provide personalized guidance based on your specific situation.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              User Responsibilities
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">By using Centsible, you agree to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Maintain account security</strong> - Keep your login credentials private and secure. Use a strong password and do not share your account access.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Enter accurate information</strong> - Provide truthful and accurate financial data to ensure the application functions properly for your needs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Use the service legally</strong> - Comply with all applicable laws and regulations in your jurisdiction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Respect the service</strong> - Do not attempt to hack, reverse engineer, or disrupt the application's functionality.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Keep backups</strong> - While we strive to protect your data, we recommend keeping your own records of important financial information.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Service Availability */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Service Availability
            </h2>
            <div className="prose prose-gray max-w-none">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Best effort uptime</strong> - We strive to keep Centsible available 24/7, but cannot guarantee uninterrupted service.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Maintenance windows</strong> - Scheduled maintenance may require temporary service interruptions, which we'll communicate in advance when possible.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Feature updates</strong> - We may modify, add, or remove features to improve the service with reasonable notice.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Account Termination */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Account Termination
            </h2>
            <div className="prose prose-gray max-w-none">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">You Can Terminate</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                      <span>Delete your account anytime through account settings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                      <span>Stop using the service at any time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                      <span>Request data export before deletion</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">We Can Terminate</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>For violation of these terms</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>For illegal or harmful activity</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>With 30 days notice for service discontinuation</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800">
                  <strong>Data Retention:</strong> Upon account termination, all data will be permanently deleted within 30 days.
                  Make sure to export any important information before closing your account.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Limitation of Liability
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="mb-4">
                Centsible is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Financial losses resulting from decisions made using the application</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Data loss or corruption (though we implement safeguards to prevent this)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Service interruptions or technical issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Third-party integrations or external service failures</span>
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
                If you have questions about these Terms of Service or need to report an issue, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">Email:</p>
                <a
                  href="mailto:terms@centsible.app"
                  className="text-[#27AE60] hover:text-[#219A52] font-medium"
                >
                  terms@centsible.app
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                We will respond to your inquiry within 48 hours.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Changes to These Terms
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                We may update these Terms of Service from time to time. When we do, we will:
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Update the "Effective Date" at the top of this document</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Notify active users via email about significant changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#27AE60] rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide a 30-day notice period for material changes</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                Continued use of the service after changes take effect constitutes acceptance of the new terms.
              </p>
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

export default Terms;