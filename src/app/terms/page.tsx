export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the AI Twitter Agent service, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                AI Twitter Agent is an automated Twitter management service that provides AI-powered content generation, 
                community monitoring, and engagement automation. The service operates 24/7 to help build and maintain 
                your Twitter presence.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Twitter OAuth Integration</h2>
              <p className="text-gray-700 mb-4">
                Our service integrates with Twitter through OAuth authentication. By connecting your Twitter account, 
                you authorize us to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Read your tweets and mentions</li>
                <li>Post tweets and replies on your behalf</li>
                <li>Access your Twitter profile information</li>
                <li>Send direct messages when configured</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can revoke these permissions at any time through your Twitter account settings or by disconnecting 
                your account from our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
                <li>Ensuring your Twitter account complies with Twitter&apos;s Terms of Service</li>
                <li>Reviewing and approving AI-generated content before posting</li>
                <li>Maintaining appropriate content standards and community guidelines</li>
                <li>Monitoring the service&apos;s performance and adjusting settings as needed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. AI Content Generation</h2>
              <p className="text-gray-700 mb-4">
                Our service uses artificial intelligence to generate content and responses. While we strive for quality 
                and relevance, AI-generated content may occasionally be inappropriate or inaccurate. You are responsible 
                for reviewing all content before it is posted to your Twitter account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Privacy and Data Security</h2>
              <p className="text-gray-700 mb-4">
                We take your privacy seriously. Your Twitter OAuth tokens are encrypted and stored securely. We do not 
                share your personal information with third parties. For detailed information about data handling, 
                please see our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                While we strive for 24/7 availability, the service may experience downtime due to maintenance, 
                updates, or technical issues. We are not liable for any losses resulting from service interruptions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                Our service is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages 
                arising from the use of our service, including but not limited to content posted on your Twitter account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                You may terminate your use of our service at any time by disconnecting your Twitter account. 
                We may terminate your access if you violate these terms or engage in inappropriate behavior.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
                posting. Your continued use of the service constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these terms, please contact us through our support channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
