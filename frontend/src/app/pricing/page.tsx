import Link from "next/link";

const check = (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const smb = (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const smbTiers = [
  { students: 50,  tests: 50,  price: "৳10,000" },
  { students: 100, tests: 100, price: "৳20,000" },
  { students: 200, tests: 200, price: "৳40,000" },
  { students: 500, tests: 500, price: "৳80,000" },
];

const packages = [
  {
    id: "smb",
    badge: null,
    name: "SMB Package",
    tagline: "Perfect for small & medium coaching centres",
    price: "Starting ৳10,000",
    priceNote: "Scale as you grow",
    accent: "#2a55a0",
    accentLight: "#d7e6ff",
    features: [
      "Desktop & Mobile Web App",
      "IELTS Academic & General Training",
      "Booking Calendar for Speaking Test",
      "Detailed Result & Score Breakdown",
      "Unlimited Google Meet for Speaking",
      "Basic Analytics Dashboard",
      "Anti-Cheat Security",
      "4 Online Training Sessions",
      "6 Months Customer Support",
      "Custom Branding (Logo & Colours)",
    ],
    notIncluded: [
      "Custom Website",
      "Custom Domain & Hosting",
      "Dedicated Server",
      "Bkash Payment Integration",
      "Zoom Integration",
      "Advanced Analytics",
    ],
  },
  {
    id: "halfyearly",
    badge: "Most Flexible",
    name: "Half-Yearly Plan",
    tagline: "Full product. Pay in two easy instalments",
    price: "৳1,00,000 × 2",
    priceNote: "50% now · 50% after 6 months",
    accent: "#9a72ff",
    accentLight: "#efe7ff",
    features: [
      "Full Custom Branding & Custom Website",
      "Desktop & Mobile Web App",
      "IELTS Academic & General Training",
      "Unlimited Students",
      "Unlimited Mock Tests",
      "Custom Domain & Hosting (1 Year)",
      "Bkash Payment Integration",
      "Anti-Cheat Security",
      "Booking Calendar for Speaking Test",
      "Unlimited Google Meet for Speaking",
      "Unlimited Zoom for Speaking",
      "Advanced Analytics Dashboard",
      "Detailed Result & Score Breakdown",
      "1 Full On-site Training + 4 Online",
      "1 Year Customer Support",
    ],
    notIncluded: [
      "Dedicated Server",
    ],
  },
  {
    id: "enterprise",
    badge: "Best Value",
    name: "Enterprise License",
    tagline: "One-time purchase. Own it forever.",
    price: "৳2,00,000",
    priceNote: "One-time · No recurring fees",
    accent: "#222225",
    accentLight: "#f6f7fb",
    features: [
      "Full Custom Branding & Custom Website",
      "Desktop & Mobile Web App",
      "IELTS Academic & General Training",
      "Unlimited Students",
      "Unlimited Mock Tests",
      "Custom Domain & Hosting (1 Year)",
      "Dedicated Server Setup",
      "Bkash Payment Integration",
      "Anti-Cheat Security",
      "Booking Calendar for Speaking Test",
      "Unlimited Google Meet for Speaking",
      "Unlimited Zoom for Speaking",
      "Advanced Analytics Dashboard",
      "Detailed Result & Score Breakdown",
      "1 Full On-site Training + 4 Online",
      "1 Year Customer Support",
      "Source Code Ownership",
    ],
    notIncluded: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8f8fb" }}>

      {/* Header */}
      <div className="bg-white border-b border-[#ececf3]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9a72ff 0%, #8f69f7 100%)" }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#222225]" style={{ letterSpacing: "-0.03em" }}>
              IELTS<span style={{ color: "#9a72ff" }}>Pro</span>
            </span>
          </div>
          <span className="text-xs font-semibold text-[#a4a4b5]">Pricing Proposal · May 2026</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ background: "#efe7ff", color: "#6a45d0" }}>
            3 Packages · Tailored for Every Scale
          </span>
          <h1 className="text-4xl font-extrabold text-[#222225] mb-3" style={{ letterSpacing: "-0.05em" }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-[#7b7b8d] text-base max-w-xl mx-auto leading-relaxed">
            Get a fully-featured IELTS platform under your own brand. Choose the plan that fits your institution — scale up any time.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-[24px] flex flex-col relative overflow-hidden"
              style={{
                border: pkg.id === "halfyearly" ? "2px solid #9a72ff" : "1px solid #f1f1f7",
                boxShadow: pkg.id === "halfyearly"
                  ? "0 20px 48px rgba(159,121,255,0.18)"
                  : "0 14px 28px rgba(32,28,54,0.06)",
              }}
            >
              {/* Badge */}
              {pkg.badge && (
                <div
                  className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={pkg.id === "halfyearly"
                    ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white" }
                    : { background: "#222225", color: "white" }
                  }
                >
                  {pkg.badge}
                </div>
              )}

              {/* Top accent bar */}
              <div className="h-1.5 w-full" style={{ background: pkg.id === "halfyearly" ? "linear-gradient(90deg, #9f79ff 0%, #8f69f7 100%)" : pkg.id === "enterprise" ? "#222225" : "#d7e6ff" }} />

              <div className="p-7 flex flex-col flex-1">
                {/* Header */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: pkg.accent }}>
                    {pkg.name}
                  </p>
                  <p className="text-sm text-[#7b7b8d] leading-snug mb-5">{pkg.tagline}</p>
                  <div>
                    <span className="text-3xl font-extrabold text-[#222225]" style={{ letterSpacing: "-0.05em" }}>{pkg.price}</span>
                    <p className="text-xs font-semibold text-[#a4a4b5] mt-1">{pkg.priceNote}</p>
                  </div>
                </div>

                {/* SMB tier table */}
                {pkg.id === "smb" && (
                  <div className="rounded-[14px] overflow-hidden mb-6" style={{ border: "1px solid #ececf3" }}>
                    <div className="grid grid-cols-3 text-[11px] font-bold text-[#7b7b8d] px-3 py-2" style={{ background: "#f6f7fb" }}>
                      <span>Students</span>
                      <span>Mock Tests</span>
                      <span>Price</span>
                    </div>
                    {smbTiers.map((tier) => (
                      <div key={tier.students} className="grid grid-cols-3 text-xs font-semibold text-[#222225] px-3 py-2.5" style={{ borderTop: "1px solid #f1f1f7" }}>
                        <span>{tier.students}</span>
                        <span>{tier.tests}</span>
                        <span style={{ color: "#2a55a0" }}>{tier.price}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 text-xs font-bold px-3 py-2.5" style={{ borderTop: "1px solid #f1f1f7", background: "#f6f7fb" }}>
                      <span className="text-[#222225]">Unlimited</span>
                      <span className="text-[#222225]">Unlimited</span>
                      <span style={{ color: "#2a55a0" }}>৳2,00,000</span>
                    </div>
                  </div>
                )}

                {/* Half-yearly breakdown */}
                {pkg.id === "halfyearly" && (
                  <div className="rounded-[14px] p-4 mb-6 flex gap-4" style={{ background: "#efe7ff" }}>
                    <div className="flex-1 text-center">
                      <p className="text-xs font-semibold text-[#7b7b8d] mb-0.5">Instalment 1</p>
                      <p className="text-base font-extrabold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>৳1,00,000</p>
                      <p className="text-[11px] font-medium text-[#9a72ff]">On signing</p>
                    </div>
                    <div className="w-px bg-[#ddd0ff]" />
                    <div className="flex-1 text-center">
                      <p className="text-xs font-semibold text-[#7b7b8d] mb-0.5">Instalment 2</p>
                      <p className="text-base font-extrabold text-[#222225]" style={{ letterSpacing: "-0.04em" }}>৳1,00,000</p>
                      <p className="text-[11px] font-medium text-[#9a72ff]">After 6 months</p>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-[#a4a4b5] uppercase tracking-widest mb-3">What&apos;s included</p>
                  <ul className="space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#353741]">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: pkg.id === "halfyearly" ? "#9a72ff" : pkg.id === "enterprise" ? "#2a9350" : "#2a55a0" }}>
                          {check}
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {pkg.notIncluded.length > 0 && (
                    <>
                      <p className="text-[11px] font-bold text-[#a4a4b5] uppercase tracking-widest mt-5 mb-3">Not included</p>
                      <ul className="space-y-2">
                        {pkg.notIncluded.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-[#a4a4b5]">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <a
                    href="mailto:hello@ieltspro.com"
                    className="block w-full text-center text-sm font-bold py-3 rounded-[14px] transition-opacity hover:opacity-90 cursor-pointer"
                    style={pkg.id === "halfyearly"
                      ? { background: "linear-gradient(135deg, #9f79ff 0%, #8f69f7 100%)", color: "white", boxShadow: "0 10px 22px rgba(159,121,255,0.28)" }
                      : pkg.id === "enterprise"
                      ? { background: "#222225", color: "white" }
                      : { border: "1.5px solid #d7e6ff", color: "#2a55a0", background: "#f6f9ff" }
                    }
                  >
                    Get started
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison note */}
        <div className="bg-white rounded-[20px] p-8 mb-10" style={{ border: "1px solid #f1f1f7", boxShadow: "0 14px 28px rgba(32,28,54,0.06)" }}>
          <h2 className="text-base font-bold text-[#222225] mb-6" style={{ letterSpacing: "-0.03em" }}>All packages include</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔐", title: "Anti-Cheat Security", desc: "Prevent tab switching & copy-paste during tests" },
              { icon: "📅", title: "Booking Calendar", desc: "Students book Speaking & Reading sessions online" },
              { icon: "📊", title: "Detailed Results", desc: "Band score breakdown per module with feedback" },
              { icon: "🎓", title: "Dual Track", desc: "Both IELTS Academic & General Training supported" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-2 p-4 rounded-[16px]" style={{ background: "#f8f8fb" }}>
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-bold text-[#222225]">{item.title}</p>
                <p className="text-xs text-[#7b7b8d] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-sm text-[#a4a4b5]">All prices in BDT · Custom requirements available on request</p>
          <p className="text-xs text-[#a4a4b5] mt-1">This proposal is valid for 30 days from the date of issue.</p>
        </div>
      </div>
    </div>
  );
}
