import { useTheme } from '../contexts/ThemeContext'

const Loading = ({ fullScreen = true }) => {
  const { isDark } = useTheme()

  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'py-12'} flex flex-col items-center justify-center transition-colors`}>
      {/* Wave interference animation */}
      <div className="relative flex items-center justify-center">
        <img
          src="/pulses.gif"
          alt="Loading..."
          className="object-contain dark:invert"
          style={{
            height: '40px',
            imageRendering: 'crisp-edges',
            mixBlendMode: isDark ? 'normal' : 'multiply'
          }}
        />
      </div>
    </div>
  )
}

export default Loading
