import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ActivityGraph = () => {
  const [activityData, setActivityData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [hoveredDay, setHoveredDay] = useState(null)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  useEffect(() => {
    fetchActivityData()
  }, [selectedYear])

  const fetchActivityData = async () => {
    setLoading(true)

    // Get the start and end of the selected year
    const startOfYear = new Date(selectedYear, 0, 1).toISOString()
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString()

    try {
      // Fetch notes created/updated in the selected year
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('created_at, updated_at, published_at')
        .or(`created_at.gte.${startOfYear},updated_at.gte.${startOfYear}`)
        .or(`created_at.lte.${endOfYear},updated_at.lte.${endOfYear}`)

      if (notesError) throw notesError

      // Process the data into a date -> count map
      const activity = {}

      notes?.forEach(note => {
        // Count created_at
        if (note.created_at) {
          const noteDate = new Date(note.created_at)
          if (noteDate.getFullYear() === selectedYear) {
            const date = noteDate.toISOString().split('T')[0]
            activity[date] = (activity[date] || 0) + 1
          }
        }

        // Count updated_at if different from created_at
        if (note.updated_at && note.updated_at !== note.created_at) {
          const noteDate = new Date(note.updated_at)
          if (noteDate.getFullYear() === selectedYear) {
            const date = noteDate.toISOString().split('T')[0]
            activity[date] = (activity[date] || 0) + 1
          }
        }

        // Count published_at if different from created_at
        if (note.published_at && note.published_at !== note.created_at) {
          const noteDate = new Date(note.published_at)
          if (noteDate.getFullYear() === selectedYear) {
            const date = noteDate.toISOString().split('T')[0]
            activity[date] = (activity[date] || 0) + 1
          }
        }
      })

      setActivityData(activity)
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate all days in the selected year (up to today if current year)
  const generateDays = () => {
    const days = []
    const startDate = new Date(selectedYear, 0, 1)
    const currentYear = new Date().getFullYear()
    const today = new Date()

    // If selected year is current year, only go up to today
    const endDate = selectedYear === currentYear
      ? today
      : new Date(selectedYear, 11, 31)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    return days
  }

  // Get activity level (0-4) for color intensity
  const getActivityLevel = (count) => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  // Get color class based on activity level
  const getColorClass = (level) => {
    const colors = {
      0: 'bg-zinc-100 dark:bg-zinc-800',
      1: 'bg-green-200 dark:bg-green-900/50',
      2: 'bg-green-400 dark:bg-green-700',
      3: 'bg-green-600 dark:bg-green-500',
      4: 'bg-green-800 dark:bg-green-300',
    }
    return colors[level] || colors[0]
  }

  const days = generateDays()

  // Find the first Monday of the year (or start from Sunday if you prefer)
  const firstDay = days[0]
  const dayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Add empty cells to align the first day properly
  const emptyCells = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Align to Monday
  const paddedDays = [...Array(emptyCells).fill(null), ...days]

  // Group days by week
  const weeks = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  // Get month labels - properly aligned with weeks
  const getMonthLabels = () => {
    const labels = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    let currentMonth = -1
    weeks.forEach((week, weekIndex) => {
      // Find first non-null day in the week
      const firstDayInWeek = week.find(day => day !== null)
      if (firstDayInWeek) {
        const month = firstDayInWeek.getMonth()

        if (month !== currentMonth) {
          labels.push({ month: months[month], weekIndex })
          currentMonth = month
        }
      }
    })

    return labels
  }

  const monthLabels = getMonthLabels()

  const currentYear = new Date().getFullYear()
  // Generate available years (from 2020 to current year, or adjust as needed)
  const startYear = 2020
  const availableYears = []
  for (let year = currentYear; year >= startYear; year--) {
    availableYears.push(year)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showYearDropdown && !event.target.closest('.year-dropdown')) {
        setShowYearDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showYearDropdown])

  if (loading) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-4"></div>
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Activity Graph
        </h3>

        {/* Year selector dropdown */}
        <div className="relative year-dropdown">
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 min-w-[80px] flex items-center justify-between gap-2"
          >
            <span className="font-medium">{selectedYear}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showYearDropdown && (
            <div className="absolute right-0 z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year)
                    setShowYearDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                    year === selectedYear
                      ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex flex-col">
        {/* Month labels */}
        <div className="flex mb-1.5 ml-[42px] gap-[2px]">
          {weeks.map((week, weekIndex) => {
            const monthLabel = monthLabels.find(label => label.weekIndex === weekIndex)
            return (
              <div
                key={weekIndex}
                className="w-[11px] text-[10px] text-zinc-500 dark:text-zinc-400"
              >
                {monthLabel ? monthLabel.month : ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-[2px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] text-[10px] text-zinc-500 dark:text-zinc-400 mr-1.5 w-[38px] text-right">
            <div className="h-[11px] leading-[11px]">Mon</div>
            <div className="h-[11px]"></div>
            <div className="h-[11px] leading-[11px]">Wed</div>
            <div className="h-[11px]"></div>
            <div className="h-[11px] leading-[11px]">Fri</div>
            <div className="h-[11px]"></div>
            <div className="h-[11px]"></div>
          </div>

          {/* Activity grid */}
          <div
            className="flex gap-[2px] flex-1 overflow-x-auto"
            onMouseLeave={() => setHoveredDay(null)}
          >
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <div
                        key={dayIndex}
                        className="w-[11px] h-[11px]"
                      />
                    )
                  }

                  const dateStr = day.toISOString().split('T')[0]
                  const count = activityData[dateStr] || 0
                  const level = getActivityLevel(count)
                  const colorClass = getColorClass(level)

                  return (
                    <div
                      key={dayIndex}
                      className={`w-[11px] h-[11px] rounded-sm ${colorClass} hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all cursor-pointer`}
                      onMouseEnter={() => setHoveredDay({ date: day, count })}
                      title={`${day.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}: ${count} ${count === 1 ? 'activity' : 'activities'}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hover tooltip - fixed height container */}
        <div className="mt-2.5 h-4 text-[10px] text-zinc-600 dark:text-zinc-300 ml-[42px]">
          {hoveredDay ? (
            <>
              <span className="font-medium">{hoveredDay.count}</span> {hoveredDay.count === 1 ? 'activity' : 'activities'} on{' '}
              {hoveredDay.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </>
          ) : (
            <span className="invisible">placeholder</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityGraph
