// src/pages/Privacy.jsx
import React from "react";
import { Panel } from "../components/ui";

export default function Privacy() {
  return (
    <Panel className="p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="text-slate-300/90 mt-2">
        Your privacy matters. This policy explains how we collect and handle your data.
      </p>

      <div className="prose prose-invert max-w-none mt-6">
        <p className="text-sm text-slate-400 italic mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2>1. Data We Collect</h2>
        <p>
          We collect account data (such as name and email), bug submissions, and usage logs to
          operate the platform and improve service quality.
        </p>

        <h2>2. How We Use Data</h2>
        <p>
          We use your data to provide and secure the platform, prevent abuse, award XP, and improve
          features and performance.
        </p>

        <h2>3. Sharing</h2>
        <p>
          We do not sell your personal data. We may share limited information with service providers
          (for example, email delivery or payment processors) and when required by law.
        </p>

        <h2>4. Security</h2>
        <p>
          We employ reasonable security measures to protect your information; however, no method of
          transmission or storage is 100% secure.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You can request access, correction, or deletion of your account data by contacting support.
        </p>

        <h2>6. Updates</h2>
        <p>
          We may update this policy from time to time. Continued use after changes means you accept
          the updated policy.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy questions, email{" "}
          <a href="mailto:support@bugbank.app" className="text-fuchsia-300 underline">
            support@bugbank.app
          </a>
          .
        </p>
      </div>
    </Panel>
  );
}
