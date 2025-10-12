const About = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
          About
        </h1>
        <div className="space-y-4">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            I'm Dvir, a developer passionate about building meaningful products
            that make a difference. I focus on creating clean, efficient solutions
            to complex problems.
          </p>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            When I'm not coding, you'll find me exploring new technologies,
            reading, or working on personal projects that push my boundaries.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
