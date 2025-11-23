// src/pages/Terms.jsx
import React from "react";
import { Panel } from "../components/ui";

export default function Terms() {
  return (
    <Panel className="p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
      <p className="text-slate-300/90 mt-2">
        Welcome to BugBank. By using our platform, you agree to these terms.
      </p>

      <div className="prose prose-invert max-w-none mt-6">
        <p className="text-sm text-slate-400 italic mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2>1. Eligibility &amp; Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account and password
          and for restricting access to your devices. You agree to accept responsibility for
          all activities that occur under your account.
        </p>

        <h2>2. Submitted Content</h2>
        <p>
          When you submit bugs or fixes, you grant us a non-exclusive, worldwide license to display
          and use that content for evaluation, verification, and awarding XP. You represent that you
          have the right to submit such content.
        </p>

        <h2>3. Rewards &amp; XP</h2>
        <p>
          XP and other rewards are granted at our discretion and may be withheld in cases of abuse,
          duplication, or violation of program rules. Rewards have no cash value unless explicitly
          stated otherwise.
        </p>

        <h2>4. Prohibited Conduct</h2>
        <p>
          You agree not to use the platform to submit unlawful, harmful, misleading, or malicious
          content. We may suspend or terminate access for violations, and we reserve the right to
          remove content at our discretion.
        </p>

        <h2>5. Changes to Terms</h2>
        <p>
          These terms may be updated from time to time. Continued use of the platform after
          changes constitutes your acceptance of the revised terms.
        </p>

        <h2>6. Contact</h2>
        <p>
          Questions? Email us at{" "}
          <a href="mailto:support@bugbank.app" className="text-fuchsia-300 underline">
            support@bugbank.app
          </a>.
        </p>
      </div>
    </Panel>
  );
}
