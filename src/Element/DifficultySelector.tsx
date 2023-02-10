import './DifficultySelector.css'
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

interface DifficultySelectorProps {
  difficulty?: number 
  setDifficulty: (difficulty: number) => void
}

function useOnClickOutside(ref: React.MutableRefObject<Element | null>, onClickOutside: () => void) {
  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (ref && ref.current && !ref.current.contains(ev.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}

export default function DifficultySelector({ difficulty, setDifficulty }: DifficultySelectorProps) {
  const ref = useRef(null);
  useOnClickOutside(ref, () => setShowSelector(false))
  const [showSelector, setShowSelector] = useState<boolean>(false);

  return (
    <span className="difficulty-selector" >
      <FontAwesomeIcon icon={faPersonDigging} onClick={() => setShowSelector(!showSelector)} />
      {showSelector && <select
            value={difficulty}
            onChange={e => setDifficulty(parseInt(e.target.value))}>
              <option value={0}><FormattedMessage {...messages.None} /> <FormattedMessage {...messages.Default} /></option>
              <option value={12}>12 (3 zeros)</option>
              <option value={16}>16 (4 zeros)</option>
              <option value={20}>20 (5 zeros)</option>
              <option value={24}>24 (6 zeros)</option>
              <option value={28}>28 (7 zeros)</option>
              <option value={32}>32 (8 zeros)</option>
            </select>}
    </span>
  )
}
