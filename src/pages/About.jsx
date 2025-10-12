const About = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
          About
        </h1>
        <div className="space-y-4">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            I'm Dvir, this will have my about me.
          </p>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            It could contain info about my background, my interests, my goals, etc.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
