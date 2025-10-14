const Loading = ({ fullScreen = true }) => {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'py-12'} flex flex-col items-center justify-center bg-white dark:bg-black transition-colors`}>
      {/* Wave interference animation */}
      <div className="relative flex items-center justify-center">
        <img
          src="https://ophysics.com/images/pulses.gif"
          alt="Loading..."
          className="object-contain dark:invert"
          style={{
            height: '40px',
            imageRendering: 'crisp-edges'
          }}
        />
      </div>
    </div>
  )
}

export default Loading
