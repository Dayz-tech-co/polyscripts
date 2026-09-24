import { useEffect } from "react";
import PageHeader from "../components/PageHeader";

const UPDATED = "September 24, 2026";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "What we collect",
        body: "PolyScripts has no accounts, logins or wallet connections. We do not collect names, emails or payment details. Our hosting provider may keep standard server logs (IP address, browser, pages requested) for security and reliability.",
      },
      {
        heading: "Data stored in your browser",
        body: "Your watchlist, recently viewed accounts and alert preference are saved in your browser's local storage. They never leave your device, and clearing your browser data removes them.",
      },
      {
        heading: "Public blockchain data",
        body: "Every trader statistic shown on PolyScripts comes from Polymarket's public APIs and the public Polygon blockchain. We display public data; we do not add private information about anyone. If you believe something shown here should not be, contact us and we will review it.",
      },
      {
        heading: "Third parties",
        body: "Your browser loads data directly from Polymarket's public APIs, a public Polygon RPC node and Google Fonts. Those services receive your IP address when they respond and are governed by their own privacy policies.",
      },
      {
        heading: "Changes",
        body: "We may update this policy. The date at the top shows the latest revision.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    sections: [
      {
        heading: "Read-only analytics",
        body: "PolyScripts is an independent analytics site. It is not affiliated with, endorsed by or operated by Polymarket. It does not place trades, hold funds or give access to any wallet.",
      },
      {
        heading: "Not financial advice",
        body: "Everything on this site - including Smart Scores, badges, smart-money leans and whale or insider signals - is automated analysis of public data, provided for information only. It is not financial, investment or legal advice. Prediction markets carry risk, and you are responsible for your own decisions.",
      },
      {
        heading: "Signals are not accusations",
        body: "Labels such as \"Insider signal\", \"Fresh wallet\" or \"Likely bot\" are pattern-based flags over public data. They are not statements of fact about any person and may be wrong.",
      },
      {
        heading: "Accuracy",
        body: "Data comes from third-party public APIs, which can be delayed, incomplete or unavailable. We show N/A rather than estimating missing values, but we cannot guarantee accuracy or availability.",
      },
      {
        heading: "Eligibility",
        body: "Using this site does not make Polymarket available to you. Follow the laws where you live, including any restrictions on prediction markets.",
      },
      {
        heading: "Liability",
        body: "The site is provided \"as is\", without warranties of any kind. To the fullest extent permitted by law, PolyScripts is not liable for losses arising from your use of it.",
      },
    ],
  },
};

export default function LegalPage({ kind }) {
  const page = CONTENT[kind] || CONTENT.terms;

  useEffect(() => {
    document.title = `${page.title} | PolyScripts`;
  }, [page.title]);

  return (
    <main id="main-content" className="container main-content legal-page">
      <PageHeader title={page.title} description={`Last updated ${UPDATED}`} />
      <article className="card legal-body">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
