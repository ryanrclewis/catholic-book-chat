import { useState, useEffect } from 'react'
import defaultContent from '../data/content'

export default function AboutPage() {
  const [copy, setCopy] = useState(defaultContent.about)

  useEffect(() => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.about) {
          setCopy(data.about)
        }
      })
      .catch((err) => console.error('Failed to load about page content dynamically:', err))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
      {/* MISSION & CONTENT */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="grid md:grid-cols-12 gap-x-12 gap-y-12 items-center">
          <div className="md:col-span-7">
            <span className="uppercase tracking-[3px] text-xs font-semibold text-[#B38B4D]">{copy.missionEyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-4 leading-tight text-[#2C1F1A]">
              {copy.missionTitle}
            </h2>
            <div className="prose prose-lg mt-8 text-[#3F2A22] max-w-[46ch] leading-relaxed">
              <p>{copy.missionParagraph1}</p>
              <p className="mt-4">{copy.missionParagraph2}</p>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-[#F9F5ED] p-9 rounded-3xl text-sm leading-relaxed border border-[#e5d9c8]">
              <div className="font-semibold text-[#4A1C2E] mb-4 tracking-wide">{copy.topicsTitle}</div>
              <ul className="space-y-3 text-[#3F2A22]">
                {copy.topics.map((topic, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-[#B38B4D]">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOSTS */}
      <section className="w-full">
        <div className="text-center mb-12">
          <span className="uppercase tracking-[4px] text-xs font-semibold text-[#B38B4D]">THE VOICES</span>
          <h2 className="text-4xl font-semibold tracking-tight mt-3 text-[#2C1F1A]">{copy.hostsTitle}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Host 1 */}
          <div className="host-card rounded-3xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-28 h-28 bg-[#EDE3D4] rounded-full mb-6 flex items-center justify-center ring-8 ring-[#F9F5ED]">
              <span className="text-4xl text-[#B38B4D]">👤</span>
            </div>
            <h3 className="font-semibold text-2xl text-[#2C1F1A]">{copy.host1Name}</h3>
            <div className="text-[#B38B4D] text-sm tracking-widest mt-0.5 mb-4">{copy.host1Role}</div>
            <p className="text-[#5C4639] max-w-[32ch] leading-relaxed">
              {copy.host1Bio}
            </p>
          </div>

          {/* Host 2 */}
          <div className="host-card rounded-3xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-28 h-28 bg-[#EDE3D4] rounded-full mb-6 flex items-center justify-center ring-8 ring-[#F9F5ED]">
              <span className="text-4xl text-[#B38B4D]">👤</span>
            </div>
            <h3 className="font-semibold text-2xl text-[#2C1F1A]">{copy.host2Name}</h3>
            <div className="text-[#B38B4D] text-sm tracking-widest mt-0.5 mb-4">{copy.host2Role}</div>
            <p className="text-[#5C4639] max-w-[32ch] leading-relaxed">
              {copy.host2Bio}
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-[#8C6F55] mt-12">{copy.footerContactNote}</p>
      </section>
    </div>
  )
}
