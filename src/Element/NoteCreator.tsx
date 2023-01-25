import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";

import "./NoteCreator.css";

import Plus from "Icons/Plus";
import useEventPublisher from "Feed/EventPublisher";
import { openFile } from "Util";
import VoidUpload from "Feed/VoidUpload";
import { FileExtensionRegex, VoidCatHost } from "Const";
import Textarea from "Element/Textarea";
import Modal from "Element/Modal";
import Event, { default as NEvent } from "Nostr/Event";
import Editor from "./Lexical";
import Tag from "Nostr/Tag";
import { useSelector } from "react-redux";
import { RootState } from "State/Store";
import { UserPreferences } from "State/Login";

export interface NoteCreatorProps {
    show: boolean
    setShow: (s: boolean) => void
    replyTo?: NEvent,
    onSend?: Function,
    onClose?(): void
    autoFocus: boolean
}

export function NoteCreator(props: NoteCreatorProps) {
    const { show, setShow } = props
    const publisher = useEventPublisher();
    const [note, setNote] = useState<string>();
    const [error, setError] = useState<string>();
    const [active, setActive] = useState<boolean>(false);
    const pref = useSelector<RootState, UserPreferences>(s => s.login.preferences);

    async function sendNote() {
        if (note) {
            let ev = props.replyTo ? await publisher.reply(props.replyTo, note) : await publisher.note(note);
            console.debug("Sending note: ", ev);
            publisher.broadcast(ev);
            setNote("");
            setShow(false);
            if (typeof props.onSend === "function") {
                props.onSend();
            }
            setActive(false);
        }
    }

    async function attachFile() {
        try {
            let file = await openFile();
            if (file) {
                let rx = await VoidUpload(file, file.name);
                if (rx?.ok && rx?.file) {
                    let ext = file.name.match(FileExtensionRegex);

                    // extension tricks note parser to embed the content
                    let url = rx.file.meta?.url ?? `${VoidCatHost}/d/${rx.file.id}${ext ? `.${ext[1]}` : ""}`;

                    setNote(n => `${n}\n${url}`);
                } else if (rx?.errorMessage) {
                    setError(rx.errorMessage);
                }
            }
        } catch (error: any) {
            setError(error?.message)
        }
    }

    function onChange(ev: any) {
        const { value } = ev.target
        setNote(value)
        if (value) {
            setActive(true)
        } else {
            setActive(false)
        }
    }

    function cancel(ev: any) {
      setShow(false)
      setNote("")
    }

    function onSubmit(ev: React.MouseEvent<HTMLButtonElement>) {
        ev.stopPropagation();
        sendNote().catch(console.warn);
    }

    const tags = new Array<Tag>();
    const users = new Map();

    if (!props.show) return null;
    return (
        <>
        <button className="note-create-button" type="button" onClick={() => setShow(!show)}>
          <Plus />
        </button>
        {show && (
          <Modal onClose={props.onClose}>
            <div className={`flex note-creator ${props.replyTo ? 'note-reply' : ''}`}>
                <div className="flex f-col mr10 f-grow">
                    {pref.useLexical && (
                        <Editor 
                        editable={true}
                        onChange={onChange}
                        content={note || ''}
                        autoFocus={props.autoFocus}
                        onFocus={() => {
                            setActive(true)
                        }}
                        className={`textarea ${active ? "textarea--focused" : ""}`}
                        tags={tags}
                        users={users}
                        />
                    ) || (
                        <Textarea
                        autoFocus={props.autoFocus}
                        className={`textarea ${active ? "textarea--focused" : ""}`}
                        onChange={onChange}
                        value={note}
                        onFocus={() => setActive(true)}
                    />
                    )}
                    {active && note && (
                        <div className="actions flex f-row">
                            <div className="attachment flex f-row">
                                {(error?.length ?? 0) > 0 ? <b className="error">{error}</b> : null}
                                <FontAwesomeIcon icon={faPaperclip} size="xl" onClick={(e) => attachFile()} />
                            </div>
                            <button type="button" className="btn" onClick={onSubmit}>
                                {props.replyTo ? 'Reply' : 'Send'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="note-creator-actions">
                <button className="secondary" type="button" onClick={cancel}>
                  Cancel
                </button>
                <button type="button" onClick={onSubmit}>
                    {props.replyTo ? 'Reply' : 'Send'}
                </button>
            </div>
          </Modal>
        )}
        </>
    );
}
