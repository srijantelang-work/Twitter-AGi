export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Account information when you sign up for our service</li>
                <li>Twitter OAuth tokens and connection data</li>
                <li>Content preferences and settings</li>
                <li>Communication preferences and support requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Twitter OAuth Data</h2>
              <p className="text-gray-700 mb-4">
                When you connect your Twitter account through OAuth, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>OAuth access tokens and refresh tokens</li>
                <li>Your Twitter user ID and username</li>
                <li>Granted OAuth scopes and permissions</li>
                <li>Connection status and health information</li>
              </ul>
              <p className="text-gray-700 mb-4">
                This data is encrypted and stored securely in our database. We do not have access to your Twitter password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Provide and maintain our AI Twitter Agent service</li>
                <li>Authenticate your Twitter account and manage OAuth connections</li>
                <li>Generate AI-powered content and responses</li>
                <li>Monitor your Twitter account for relevant conversations</li>
                <li>Send you service updates and notifications</li>
                <li>Improve our service and develop new features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure OAuth token storage with encryption</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers and infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>To service providers who assist in operating our service</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Any third-party service providers are bound by confidentiality agreements and data protection requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide our service:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Account information: Until you delete your account</li>
                <li>OAuth tokens: Until you disconnect your Twitter account</li>
                <li>Service logs: For up to 90 days for debugging and support</li>
                <li>Analytics data: Aggregated and anonymized for up to 2 years</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect your Twitter account at any time</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Maintain your session and authentication</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze service usage and performance</li>
                <li>Provide personalized content and features</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Our service integrates with:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Twitter API for OAuth and content management</li>
                <li>Supabase for data storage and authentication</li>
                <li>AI services for content generation</li>
                <li>Analytics services for service improvement</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Each third-party service has its own privacy policy and data handling practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe your 
                child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this privacy policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Posting the new policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a notice in our service</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Your continued use of our service after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Email: privacy@aitwitteragent.com</li>
                <li>Support: Through our service dashboard</li>
                <li>Address: [Your Company Address]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
