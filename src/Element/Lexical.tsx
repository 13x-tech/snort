import {LexicalComposer} from '@lexical/react/LexicalComposer';

import {ReactNode} from 'react';
import {HeadingNode} from '@lexical/rich-text'
import {ListItemNode, ListNode} from '@lexical/list'
import CustomHashtagNode from './Lexical/Hashtag';

import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import {LINK_MATCHERS} from './Lexical/Link'
import { editorState } from './Lexical/Markdown';
import AutoEmbedPlugin, { REGISTER_AUTO_NODES } from './Lexical/AutoEmbed';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.
  function onError(error: Error) {
    console.error(error);
  }

  interface EditorProps {
    children?: ReactNode;
    editable?: boolean;
    className?: string
    content: string,
    tags: Tag[],
    users: Map<string, MetadataCache>
  }
  
  export default function Editor({ editable, content, tags, users }:EditorProps) {
    const theme = {
    } 

    const initialConfig = {
      namespace: 'MyEditor',
      theme,
      onError,
      nodes: [
        ...CustomHashtagNode.nodes(),
        ...REGISTER_AUTO_NODES,
        HeadingNode, ListNode, ListItemNode],
      editable: editable,
      editorState: editorState(content),
    };


    return (
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={<ContentEditable className="text" />}
            placeholder={<>...</>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <AutoEmbedPlugin 
            matchers={LINK_MATCHERS(tags,users)}
          />
          <HashtagPlugin />
        </LexicalComposer>
      );
  }

