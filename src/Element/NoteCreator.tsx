import "./NoteCreator.css";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

import Attachment from "Icons/Attachment";
import useEventPublisher from "Feed/EventPublisher";
import { openFile } from "Util";
import Textarea from "Element/Textarea";
import Modal from "Element/Modal";
import ProfileImage from "Element/ProfileImage";
import { default as NEvent } from "Nostr/Event";
import useFileUpload from "Upload";

import messages from "./messages";
import { useSelector } from "react-redux";
import { RootState } from "State/Store";
import { UserPreferences } from "State/Login";
import { faPersonDigging } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface NotePreviewProps {
  note: NEvent;
}

function NotePreview({ note }: NotePreviewProps) {
  return (
    <div className="note-preview">
      <ProfileImage pubkey={note.PubKey} />
      <div className="note-preview-body">
        {note.Content.slice(0, 136)}
        {note.Content.length > 140 && "..."}
      </div>
    </div>
  );
}

export interface NoteCreatorProps {
  show: boolean;
  setShow: (s: boolean) => void;
  replyTo?: NEvent;
  onSend?: () => void;
  autoFocus: boolean;
}

export function NoteCreator(props: NoteCreatorProps) {
  const { show, setShow, replyTo, onSend, autoFocus } = props;
  const publisher = useEventPublisher();
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>();
  const [active, setActive] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [showDifficultySelector, setShowDifficultySelector] = useState<boolean>(false);
  const pref = useSelector<RootState, UserPreferences>(s => s.login.preferences);
  const uploader = useFileUpload();
  const hasErrors = (error?.length ?? 0) > 0;

  async function sendNote() {
    if (note) {
      const ev = replyTo ? await publisher.reply(replyTo, note) : await publisher.note(note);
      if (ev && difficulty > 0) {
        await publisher.work(difficulty, ev)
      } else {
        console.debug("Sending note: ", ev);
        publisher.broadcast(ev);
      }

      setNote("");
      setShow(false);

      if (difficulty > 0) {
        if (typeof onSend === "function") {
          onSend();
        }
      }

      setActive(false);
    }
  }

  async function attachFile() {
    try {
      const file = await openFile();
      if (file) {
        const rx = await uploader.upload(file, file.name);
        if (rx.url) {
          setNote(n => `${n ? `${n}\n` : ""}${rx.url}`);
        } else if (rx?.error) {
          setError(rx.error);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error?.message);
      }
    }
  }

  function onChange(ev: React.ChangeEvent<HTMLTextAreaElement>) {
    const { value } = ev.target;
    setNote(value);
    if (value) {
      setActive(true);
    } else {
      setActive(false);
    }
  }

  function cancel() {
    setShow(false);
    setNote("");
  }

  function onSubmit(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.stopPropagation();
    sendNote().catch(console.warn);
  }

  return (
    <>
      {show && (
        <Modal className="note-creator-modal" onClose={() => setShow(false)}>
          {replyTo && <NotePreview note={replyTo} />}
          <div className={`flex note-creator ${replyTo ? "note-reply" : ""}`}>
            <div className="flex f-col mr10 f-grow">
              <Textarea
                autoFocus={autoFocus}
                className={`textarea ${active ? "textarea--focused" : ""}`}
                onChange={onChange}
                value={note}
                onFocus={() => setActive(true)}
              />
              {pref.nip13Engine !== "none" && (
                <div className="flex">
                  <button type="button" className="proof-of-work" onClick={() => setShowDifficultySelector(!showDifficultySelector)}>
                    <FontAwesomeIcon icon={faPersonDigging} /> {difficulty && difficulty > 0 ? <>{difficulty}</> : null}
                  </button>
                  {showDifficultySelector && (
                    <div className="difficulty-selector">
                      <div className="flex f-col difficulty-selector-float">
                        <span className="selector-title"><FormattedMessage {...messages.SelectDifficulty} /> </span>
                        <select value={difficulty} onChange={e => {
                          setDifficulty(parseInt(e.target.value))
                          setShowDifficultySelector(false)
                        }
                        }>
                          <option value={0}><FormattedMessage {...messages.None} /> <FormattedMessage {...messages.Default} /></option>
                          <option value={12}>12 (3 zeros)</option>
                          <option value={16}>16 (4 zeros)</option>
                          <option value={20}>20 (5 zeros)</option>
                          <option value={24}>24 (6 zeros)</option>
                          <option value={28}>28 (7 zeros)</option>
                          <option value={32}>32 (8 zeros)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button type="button" className="attachment" onClick={attachFile}>
                <Attachment />
              </button>
            </div>
            {hasErrors && <span className="error">{error}</span>}
          </div>
          <div className="note-creator-actions">
            <button className="secondary" type="button" onClick={cancel}>
              <FormattedMessage {...messages.Cancel} />
            </button>
            <button type="button" onClick={onSubmit}>
              {replyTo ? <FormattedMessage {...messages.Reply} /> : <FormattedMessage {...messages.Send} />}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
