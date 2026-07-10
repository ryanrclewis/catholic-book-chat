export default function DonatePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="donate-panel overflow-hidden rounded-3xl border border-[#e5d9c8] bg-white shadow-sm">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-10 md:p-12">
            <span className="uppercase tracking-[3px] text-xs font-semibold text-[#B38B4D]">SUPPORT THE SHOW</span>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4 text-[#2C1F1A]">
              Donate to keep Between The Lines going
            </h2>
            <p className="mt-5 text-[#5C4639] leading-relaxed">
              If you’d like to help with hosting, production, and future episodes, use the PayPal button on the right. Your support helps cover:
            </p>
            <ul className="space-y-2 mt-4 text-[#3F2A22] text-sm">
              <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> High-quality hosting and distribution platforms</li>
              <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Audio recording gear and production editing resources</li>
              <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Acquiring Catholic literature and study guides for show prep</li>
            </ul>
          </div>

          <div className="bg-[#F9F5ED] border-t md:border-t-0 md:border-l border-[#e5d9c8] p-10 flex flex-col justify-center gap-4 text-center">
            <div className="text-xs uppercase tracking-[3px] font-semibold text-[#8C6F55]">PayPal Link</div>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=YOUR_PAYPAL_BUTTON_ID"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full px-8"
            >
              Donate with PayPal
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
