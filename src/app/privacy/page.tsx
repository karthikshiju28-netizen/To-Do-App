import LegalPage, { contactLine } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy · Syllabus To-Do" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 8, 2026">
      <p>
        Syllabus To-Do turns course documents into a personal to-do list. This page explains what we collect, why, and who else sees it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> your email address and, if you sign in with Google, your name. We never receive your Google password.</li>
        <li><b>Your lists:</b> the semester dates, class and list names, and the to-do items you or the app create.</li>
        <li><b>Files and text you upload:</b> syllabi, screenshots, PDFs or pasted text, and the quick-add notes you type.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To show you your own to-do list and keep it in sync across your devices.</li>
        <li>To read your uploaded files and quick-add notes and suggest deadlines, which you review before anything is saved.</li>
        <li>To limit usage per person so the service stays available. We don&apos;t sell your data and we don&apos;t show ads.</li>
      </ul>

      <h2>Who else handles your data</h2>
      <ul>
        <li><b>Supabase</b> stores the database and your uploaded files. Each person can only access their own rows and files.</li>
        <li><b>Vercel</b> hosts the website.</li>
        <li><b>Google (Gemini API)</b> receives the content of files and notes you submit so it can find the deadlines. This app uses Google&apos;s free tier, and Google states that content sent on the free tier may be used to improve its products. <b>Please don&apos;t upload anything private or confidential.</b></li>
        <li><b>Google sign-in</b>, if you choose it, shares your name and email with us.</li>
      </ul>

      <h2>Keeping and deleting your data</h2>
      <p>
        Your data stays until you ask us to remove it. You can delete individual items in the app at any time. To delete your account and everything stored with it, {contactLine}.
      </p>

      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in. No advertising or tracking cookies.</p>

      <h2>Children</h2>
      <p>The service is intended for students aged 13 and over.</p>

      <h2>Changes and contact</h2>
      <p>If this policy changes, we&apos;ll update the date above. Questions or deletion requests: {contactLine}.</p>
    </LegalPage>
  );
}
