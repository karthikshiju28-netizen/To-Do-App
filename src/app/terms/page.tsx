import LegalPage, { contactLine } from "@/components/LegalPage";

export const metadata = { title: "Terms of Service · Syllabus To-Do" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 8, 2026">
      <p>By using Syllabus To-Do you agree to these terms. It is a small, free project run by an individual.</p>

      <h2>The service</h2>
      <p>
        The app helps you organise deadlines. It uses AI to suggest deadlines from the documents you upload, and <b>the suggestions can be wrong or incomplete</b>. Always check dates against your official course materials. You are responsible for your own deadlines.
      </p>

      <h2>Your content</h2>
      <ul>
        <li>You keep ownership of what you upload. You give us permission to store it and send it to our AI provider to provide the service.</li>
        <li>Only upload material you are allowed to share. Don&apos;t upload private, confidential or sensitive information.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>No attempts to break, overload or get around limits on the service, or to access other people&apos;s data.</li>
        <li>No unlawful or abusive content.</li>
        <li>We may set usage limits (for example, a number of uploads per day) and may suspend accounts that misuse the service.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;, without promises of availability or accuracy. It may change, have downtime, or be shut down. To the extent the law allows, we are not liable for missed deadlines or lost data. Keep your own copy of anything important.
      </p>

      <h2>Contact</h2>
      <p>For questions or to delete your account, {contactLine}.</p>
    </LegalPage>
  );
}
