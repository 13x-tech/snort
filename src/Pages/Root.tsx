import "./Root.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";

import Tabs, { Tab } from "Element/Tabs";
import { RootState } from "State/Store";
import Timeline from "Element/Timeline";
import { HexKey } from "Nostr";
import { TimelineSubject } from "Feed/TimelineFeed";

import messages from "./messages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonDigging } from "@fortawesome/free-solid-svg-icons";
import DifficultySelector from "Element/DifficultySelector";
import { useMemo } from "react";
import { useEffect } from "react";
import { UserPreferences, setPreferences } from "State/Login";

const RootTab: Record<string, Tab> = {
  Posts: {
    text: <FormattedMessage {...messages.Posts} />,
    value: 0,
  },
  PostsAndReplies: {
    text: <FormattedMessage {...messages.Conversations} />,
    value: 1,
  },
  Global: {
    text: <FormattedMessage {...messages.Global} />,
    value: 2,
  },
};

export default function RootPage() {
  const [loggedOut, pubKey, follows] = useSelector<RootState, [boolean | undefined, HexKey | undefined, HexKey[]]>(
    s => [s.login.loggedOut, s.login.publicKey, s.login.follows]
  );

  const prefs = useSelector<RootState, UserPreferences>(s => s.login.preferences) 
  const [tab, setTab] = useState<Tab>(RootTab.Posts);
  const [difficulty,setDifficulty] = useState<number>(prefs.nip13TargetDifficulty);
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setPreferences({
      ...prefs,
      nip13TargetDifficulty: difficulty,
    }))
  }, [difficulty])

  function followHints() {
    if (follows?.length === 0 && pubKey && tab !== RootTab.Global) {
      return (
        <FormattedMessage
          {...messages.NoFollows}
          values={{
            newUsersPage: (
              <Link to={"/new"}>
                <FormattedMessage {...messages.NewUsers} />
              </Link>
            ),
          }}
        />
      );
    }
  }

  const isGlobal = loggedOut || tab.value === RootTab.Global.value;
  const timelineSubect: TimelineSubject = useMemo(() => {
    console.log('difficulty', difficulty)
    return isGlobal
      ? { type: "global", items: [], discriminator: "all", minDifficulty: difficulty}
      : { type: "pubkey", items: follows, discriminator: "follows" };
  },[difficulty]) 
  return (
    <>
      <div className="main-content flex">
        {pubKey && <Tabs tabs={[RootTab.Posts, RootTab.PostsAndReplies, RootTab.Global]} tab={tab} setTab={setTab} />}
        {isGlobal && <DifficultySelector setDifficulty={setDifficulty} difficulty={difficulty}/>}
      </div>
      {followHints()}
      <Timeline
        key={tab.value}
        subject={timelineSubect}
        postsOnly={tab.value === RootTab.Posts.value}
        method={"TIME_RANGE"}
        window={tab.value === RootTab.Global.value ? 60 : undefined}
      />
    </>
  );
}
