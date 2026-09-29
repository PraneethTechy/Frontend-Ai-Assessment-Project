import PageHeader from "../../components/common/PageHeader";
import { HelpCircle, CheckCircle2, Sparkles, BookOpen } from "lucide-react";

const HelpSupport = () => {
  const faqs = [
    {
      q: "How does AI question generation work?",
      a: "When you configure an assessment, our AI agent evaluates the domain, technologies, and difficulty distribution (easy, medium, hard) to generate randomized multiple-choice questions grouped into multiple sets.",
    },
    {
      q: "How do candidates apply and take tests?",
      a: "Publish the assessment to generate a unique candidate link or QR code. Candidates register or sign in, submit their application, and wait for your approval. Once approved and activated, they can take the timed exam.",
    },
    {
      q: "How is candidate cheating prevented?",
      a: "Each candidate is assigned a randomized set of questions with shuffled answer options. Tests are strictly timed with live auto-submission and single-attempt guarantees.",
    },
    {
      q: "How do I export candidate rankings and scores?",
      a: "Navigate to the Reports & Exports tab or click 'Export CSV' on any assessment or drive results page to download clean spreadsheet records.",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Help & Platform Documentation"
        subtitle="Guides, best practices, and answers to common questions about the AI Assessment Platform."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                {faq.q}
              </h3>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
