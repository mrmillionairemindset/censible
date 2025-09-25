import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, HelpCircle, Building, Clock, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactCategories = [
    {
      id: 'support',
      title: 'General Support',
      description: 'Account issues, billing questions, or general help',
      email: 'support@centsible.app',
      icon: HelpCircle,
      responseTime: '24 hours'
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      description: 'Bug reports, app crashes, or technical problems',
      email: 'tech@centsible.app',
      icon: MessageSquare,
      responseTime: '12 hours'
    },
    {
      id: 'business',
      title: 'Business Inquiries',
      description: 'Partnerships, press, or business opportunities',
      email: 'business@centsible.app',
      icon: Building,
      responseTime: '2-3 days'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for contacting us. We'll get back to you within the expected timeframe for your inquiry type.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-[#27AE60] text-white px-6 py-2 rounded-lg hover:bg-[#219A52] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Contact Us
          </h1>
          <p className="text-gray-600 text-lg">
            We're here to help! Choose the best way to reach us based on your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>

            {contactCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-[#27AE60] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#27AE60] bg-opacity-10 rounded-lg">
                      <Icon className="w-6 h-6 text-[#27AE60]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-gray-600 mb-3">{category.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${category.email}`}
                            className="text-[#27AE60] hover:text-[#219A52] font-medium"
                          >
                            {category.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Response time: {category.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Quick Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Include your account email for faster support</li>
                <li>• For technical issues, describe steps to reproduce the problem</li>
                <li>• Check our Help section first for common questions</li>
                <li>• Business inquiries may take longer due to review process</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                >
                  <option value="">Select a category...</option>
                  {contactCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent resize-vertical"
                  placeholder="Please provide as much detail as possible..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#27AE60] text-white py-3 px-4 rounded-lg hover:bg-[#219A52] transition-colors font-medium"
              >
                Send Message
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                By submitting this form, you agree to our Privacy Policy. We'll only use your information to respond to your inquiry and won't share it with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Ways to Get Help</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Help Center</h3>
              <p className="text-gray-600 mb-3">
                Check our comprehensive help documentation for common questions and step-by-step guides.
              </p>
              <button className="text-[#27AE60] hover:text-[#219A52] font-medium text-sm">
                Visit Help Center →
              </button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
              <p className="text-gray-600 mb-3">
                Check if there are any known issues or maintenance affecting Centsible services.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;