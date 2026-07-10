import { useState, useEffect } from 'react'
import defaultContent from '../data/content'

export default function DonatePage() {
  const [copy, setCopy] = useState(defaultContent.donate)

  useEffect(() => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.donate) {
          setCopy(data.donate)
        }
      })
      .catch((err) => console.error('Failed to load donate page content dynamically:', err))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="donate-panel overflow-hidden rounded-3xl border border-[#e5d9c8] bg-white shadow-sm">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-10 md:p-12">
            <span className="uppercase tracking-[3px] text-xs font-semibold text-[#B38B4D]">{copy.supportEyebrow}</span>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-4 text-[#2C1F1A]">
              {copy.title}
            </h2>
            <p className="mt-5 text-[#5C4639] leading-relaxed">
              {copy.description}
            </p>
            <ul className="space-y-2 mt-4 text-[#3F2A22] text-sm">
              {copy.benefits.map((benefit, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-[#B38B4D]">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#F9F5ED] border-t md:border-t-0 md:border-l border-[#e5d9c8] p-10 flex flex-col justify-center gap-4 text-center">
            <div className="text-xs uppercase tracking-[3px] font-semibold text-[#8C6F55]">PayPal Link</div>
            <a
              href={`https://www.paypal.com/donate/?hosted_button_id=${copy.paypalButtonId}`}
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
