import './CircleTimer.css'
import { faInfinity, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react"

interface CircleTimerProps {
  start: number
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
}

export default function CircleTimer({start, onCancel}: CircleTimerProps) {
  const [timeSince, setTimeSince] = useState<number>(0);
  const [mouseOver, setMouseOver] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSince(calcTimeSince(start))
    }, 50)

    return () => {
      clearInterval(interval)
    }

  }, [start])

  const tickTime = useMemo(() => {
    const tick = Math.ceil(timeSince / 1000)
    if(tick > 60) {
      return <FontAwesomeIcon icon={faInfinity} size="xs" /> 
    }
    return tick
  }, [timeSince])

  const calcTimeSince = (start: number) => {
    return new Date().getTime() - start
  }
  return (
    <div className="flex" onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
      <button type="button" className="circle" onClick={onCancel}>
        {mouseOver && (
          <span>
            <FontAwesomeIcon icon={faX} size="xs" />
          </span>
        ) || (
          <span className="timeout-counter">
            {tickTime}
          </span>
        )}
      </button>
    </div>
  )
}