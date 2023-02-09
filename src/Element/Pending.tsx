import './Pending.css'
import { RootState } from "State/Store";
import { MouseEvent, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import CircleTimer from "./CircleTimer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faCheck } from "@fortawesome/free-solid-svg-icons";
import NoteTime from './NoteTime';
import { PendingInfo, setCancel } from 'State/Pending/Pending';
import { RawEvent } from 'Nostr';


export default function Pending() {
  const pending = useSelector<RootState, PendingInfo[]>(s => s.pending.pending);

  const pendingEvents = useMemo(() => {
    return [...pending].sort((a,b) => b.start - a.start)
  }, [pending])

  return (
    <div>
      {pendingEvents.map(e => <Item pending={e} />)}
    </div>
  )
}

interface ItemProps {
  className?: string
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
  pending: PendingInfo 
}

function Icon({ pending, className, onCancel }: ItemProps) {
  const message = useMemo(() => {
    return pending.statusMessage
  }, [pending])

  switch (pending.status) {
    case "pending":
      return <CircleTimer onCancel={onCancel} start={pending.start} />
    case "success":
      return <span className={`success${className ? " " + className : ""}`}><FontAwesomeIcon icon={faCheck} /> {message}</span>
    default:
      return <span className={`error${className ? " " + className : ""}`}><FontAwesomeIcon icon={faCancel} /> {message}</span>
  }
}

interface PowInfo {
  difficulty: number
  event: RawEvent
}

function isPowInfo(info: any): info is PowInfo {
  return "difficulty" in info && "event" in info
}

function Item({ pending, className }: ItemProps) {
  const dispatch = useDispatch();

  const content = useMemo(() => {
    if(!isPowInfo(pending.info)) {
      return ""
    }
    const noteContent = pending.info.event.content
    return noteContent.length > 64 ? noteContent.slice(0, 63) + '...' : noteContent
  }, [pending.info])

  const onCancel = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation()
    dispatch(setCancel({id:pending.id, message: 'canceled'}))
  }

  const onClick = () => {
    alert('clicked')
  }

  return (
    <div className={`pending-note flex card${className ? ' ' + className : ''}`} onClick={onClick}>
      <Icon pending={pending} onCancel={onCancel} />
      <span className="pending-content">{content}</span>
      <div className="info">
        <NoteTime from={pending.start} />
      </div>
    </div>
  )
}