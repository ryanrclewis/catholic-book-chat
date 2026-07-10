export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
      {/* MISSION & CONTENT */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="grid md:grid-cols-12 gap-x-12 gap-y-12 items-center">
          <div className="md:col-span-7">
            <span className="uppercase tracking-[3px] text-xs font-semibold text-[#B38B4D]">OUR MISSION</span>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-4 leading-tight text-[#2C1F1A]">
              Reading between the lines,<br />with faith and reason.
            </h2>
            <div className="prose prose-lg mt-8 text-[#3F2A22] max-w-[46ch] leading-relaxed">
              <p>Between The Lines is a Catholic podcast dedicated to slow, thoughtful conversation about books that matter — and the deeper questions they raise about God, the human person, culture, and the good life.</p>
              <p className="mt-4">We believe great literature is one of the best ways to understand ourselves and the world. Join us as we read, reflect, and talk through the stories that shape souls.</p>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-[#F9F5ED] p-9 rounded-3xl text-sm leading-relaxed border border-[#e5d9c8]">
              <div className="font-semibold text-[#4A1C2E] mb-4 tracking-wide">WHAT WE TALK ABOUT</div>
              <ul className="space-y-3 text-[#3F2A22]">
                <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Classic and contemporary Catholic literature</li>
                <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Theology, philosophy, and the moral imagination</li>
                <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Fiction that illuminates truth</li>
                <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> History, culture, and the life of the Church</li>
                <li className="flex gap-3"><span className="text-[#B38B4D]">•</span> Books you’ve always meant to read</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOSTS */}
      <section className="w-full">
        <div className="text-center mb-12">
          <span className="uppercase tracking-[4px] text-xs font-semibold text-[#B38B4D]">THE VOICES</span>
          <h2 className="text-4xl font-semibold tracking-tight mt-3 text-[#2C1F1A]">Hosts & Guests</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Host 1 */}
          <div className="host-card rounded-3xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-28 h-28 bg-[#EDE3D4] rounded-full mb-6 flex items-center justify-center ring-8 ring-[#F9F5ED]">
              <span className="text-4xl text-[#B38B4D]">👤</span>
            </div>
            <h3 className="font-semibold text-2xl text-[#2C1F1A]">B. Shinkle</h3>
            <div className="text-[#B38B4D] text-sm tracking-widest mt-0.5 mb-4">HOST &amp; FOUNDER</div>
            <p className="text-[#5C4639] max-w-[32ch] leading-relaxed">
              Founder of Between The Lines. Passionate about Catholic literature, theology, and classical education.
            </p>
          </div>

          {/* Host 2 */}
          <div className="host-card rounded-3xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-28 h-28 bg-[#EDE3D4] rounded-full mb-6 flex items-center justify-center ring-8 ring-[#F9F5ED]">
              <span className="text-4xl text-[#B38B4D]">👤</span>
            </div>
            <h3 className="font-semibold text-2xl text-[#2C1F1A]">Guest Speakers</h3>
            <div className="text-[#B38B4D] text-sm tracking-widest mt-0.5 mb-4">CONTRIBUTORS</div>
            <p className="text-[#5C4639] max-w-[32ch] leading-relaxed">
              Different guests, priests, authors, and scholars join the podcast to share their expertise and insights.
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-[#8C6F55] mt-12">Want to suggest a book or be a guest? Reach out to hello@betweenthelines.fm</p>
      </section>
    </div>
  )
}
