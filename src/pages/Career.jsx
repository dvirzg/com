import { useState, useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'

const Career = () => {
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect()
        setShowStickyTitle(titleRect.top < 80)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const experiences = [
    {
      role: 'Machine Learning Engineer',
      company: 'Cash App (Block)',
      location: 'San Francisco, CA',
      period: 'May - Aug 2025',
      logo: '/logos/block-jewel.svg',
      secondaryLogo: '/logos/cashapp-new.png',
      highlights: [
        'Scaled fraud train and test data 20x by building a multi-agent AI, cutting ML iteration from monthly to weekly',
        'Built an end-to-end feature engineering automation pipeline that converted agent insights into production signals',
        'Improved fraud detection precision by 15% at constant recall through expanded training data and new features',
        'Reduced analyst workload 80% by automating case risk summaries with Snowflake, Pinecone, and FAISS'
      ]
    },
    {
      role: 'Research Assistant',
      company: 'Perimeter Institute for Theoretical Physics',
      location: 'Waterloo, ON',
      period: 'Jan - Aug 2024',
      logo: '/logos/perimeter-inverted.png',
      highlights: [
        'Advanced research in quantum foundations and causal inference under Dr. Robert Spekkens and Dr. Elie Wolfe',
        'Derived new precision limit Bell inequalities and compatibility constraints for hidden-variable causal structures using GurobiPy based linear programming and NetworkX DAG analyses',
        'Represented research group at three international conferences, including Mila (Montreal) and cAI24 (SF)',
        "Contributed to Intact's follow-up $6M donation to Perimeter by demonstrating the industry-academic partnership's data science impact"
      ]
    },
    {
      role: 'Data Scientist',
      company: 'Intact Data Lab',
      location: 'Toronto, ON',
      period: 'Jan - Aug 2024',
      logo: '/logos/intact.png',
      highlights: [
        'Prevented $3.1M annual logistical costs by applying causal ML for optimal interventions and success probabilities',
        'Increased prediction accuracy from 40% to 80% on sparse, high-dimensional data using autoencoders and external behavioral and socioeconomic datasets',
        "Led the company's first causal ML initiative from R&D to executive presentation, including to the CEO"
      ]
    },
    {
      role: 'Technical Team Lead',
      company: 'WAT.ai, a Student Design Team',
      location: 'Waterloo, ON',
      period: 'Sep 2024 – Apr 2025',
      logo: '/logos/watai-icon.jpeg',
      highlights: [
        'Led a 15-student team building personalized diabetes causal time-series models with healthcare startup Gluroo',
        'Created a simulator for insulin timing and dosage using personalized blood glucose trajectory modeling',
        'Published two research papers at the ATTD 2025 international diabetes technology conference in Amsterdam'
      ],
      link: 'https://github.com/dvirzg'
    },
    {
      role: 'Data Engineer',
      company: 'Ontario Health',
      location: 'Toronto, ON',
      period: 'Jan - Apr 2023',
      logo: '/logos/ontariohealth-trillium.png',
      highlights: [
        'Accelerated COVID-19 data processing by 90% by parallelizing Pandas and SQL scripts on 80M records',
        'Resolved memory overload crashes that blocked back-testing capabilities'
      ]
    }
  ]

  const projects = [
    {
      name: 'Persona',
      description: 'Personalized LLM with vector, graph, and relational memory via tool calling',
      link: 'https://socratica.info',
      logo: '/logos/socratica.jpeg',
      note: 'Presented at Socratica Symposium'
    },
    {
      name: 'Workshop Lead @ Hack the North 24',
      description: "Taught hackers Causal ML and Simpson's Paradox at Canada's largest hackathon",
      logo: '/logos/hackthenorth.png'
    },
    {
      name: 'Price Consensus',
      description: 'Auction-style web app for fixed-budget allocation of items'
    },
    {
      name: 'ML Counterfactuals Paper',
      description: 'Estimation of counterfactual blood glucose',
      note: 'Presented at ATTD 2025 in Amsterdam'
    }
  ]

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-black/80 transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
            Career
          </h1>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
              Career
            </h1>
          </div>

          {/* Education */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Education</h2>
            <div className="relative">
              <div className="absolute -left-32 top-0 hidden lg:block">
                <img
                  src="/logos/waterloo.png"
                  alt="University of Waterloo logo"
                  className="w-24 h-24 rounded-lg object-contain bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <div className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-6">
                <div className="mb-2">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">University of Waterloo</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Honours B.Sc. Mathematical Physics Co-op</p>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">Graduation Dec 2026 • Waterloo, ON</p>
              </div>
            </div>
          </section>

          {/* Experience */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Experience</h2>
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <div key={index} className="relative">
                  {exp.logo && (
                    <div className="absolute -left-32 top-0 hidden lg:block">
                      {exp.secondaryLogo ? (
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src={exp.secondaryLogo}
                            alt={`${exp.company} secondary logo`}
                            className="w-20 h-20 rounded-lg object-contain bg-white dark:bg-zinc-900 p-2 border border-zinc-200 dark:border-zinc-800"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                          <span className="text-xl text-zinc-400 dark:text-zinc-600 -my-1">⊂</span>
                          <img
                            src={exp.logo}
                            alt={`${exp.company} logo`}
                            className="w-20 h-20 rounded-lg object-contain bg-white dark:bg-zinc-900 p-2 border border-zinc-200 dark:border-zinc-800"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                      ) : (
                        <img
                          src={exp.logo}
                          alt={`${exp.company} logo`}
                          className="w-24 h-24 rounded-lg object-contain bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      )}
                    </div>
                  )}
                  <div className="border-l-2 border-zinc-200 dark:border-zinc-800 pl-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                    <div className="mb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{exp.role}</h3>
                        <span className="text-sm text-zinc-500 dark:text-zinc-500">{exp.period}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-600 dark:text-zinc-400">{exp.company}</p>
                        {exp.link && (
                          <a
                            href={exp.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">{exp.location}</p>
                    </div>
                    <ul className="space-y-2">
                      {exp.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          <span className="text-zinc-400 dark:text-zinc-600 mr-2">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Notable Projects</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {project.logo && (
                      <img
                        src={project.logo}
                        alt={`${project.name} logo`}
                        className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{project.name}</h3>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-2">
                    {project.description}
                  </p>
                  {project.note && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 italic">
                      {project.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Technical Skills</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Languages</h3>
                <p className="text-zinc-700 dark:text-zinc-300">Python, SQL, R</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Tools & Libraries</h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Pandas, NumPy, PyTorch, Scikit-learn, Matplotlib, Gurobi, NetworkX, SentenceTransformers, Git, Linux
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default Career
