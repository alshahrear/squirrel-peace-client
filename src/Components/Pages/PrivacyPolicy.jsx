import { Helmet } from "react-helmet";
import privacyBanner from "../../assets/blogcat4.jpg"; 

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#f7f7f7]">
      <Helmet>
        <title>Privacy Policy - Storial Peace</title>
      </Helmet>

      {/* ✅ Banner Section */}
      <div
        className="h-[280px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: `url(${privacyBanner})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <h1 className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
          Privacy Policy
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          This Privacy Policy describes how <strong>Storial Peace</strong> ("we", "our", or "us") collects, uses, and protects the personal information of users visiting <strong>https://storialpeace.com</strong>. By accessing our website, you agree to the terms of this policy.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
        <p className="mb-4">
          We may collect the following types of information:
          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Your name and email address (via newsletter subscription or comments)</li>
            <li>Usage data and analytics through cookies</li>
            <li>Your IP address and browser type</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
        <p className="mb-4">
          We use your information to:
          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Send newsletters or blog updates (only with your consent)</li>
            <li>Improve website functionality and content</li>
            <li>Respond to user comments or inquiries</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Cookies</h2>
        <p className="mb-4">
          We use cookies to analyze website traffic and enhance user experience. You can disable cookies through your browser settings, but some parts of the site may not function properly.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Third-Party Services</h2>
        <p className="mb-4">
          We may use third-party services like Google Analytics or email newsletter platforms, which may collect your data in accordance with their own privacy policies. We do not share your personal data with third parties for marketing purposes without your consent.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Protection</h2>
        <p className="mb-4">
          We implement security measures to protect your personal data from unauthorized access. However, please note that no method of online transmission is 100% secure.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Rights</h2>
        <p className="mb-4">
          You have the right to:
          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Access or correct your personal information</li>
            <li>Unsubscribe from email communications at any time</li>
            <li>Request deletion of your personal data</li>
          </ul>
          To exercise any of these rights, contact us at <strong>alshahrear1@gmail.com</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We encourage you to review this page periodically for any changes.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
        <p className="mb-4">
          If you have any questions or concerns about this Privacy Policy, please contact us at:
          <br />
          📧 <strong>alshahrear1@gmail.com</strong>
          <br />
          🌐 <strong>https://storialpeace.com</strong>
        </p>

        <p className="text-sm text-gray-500 mt-8">
          Last updated: [June 18, 2025]
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
