import {LexicalComposer} from '@lexical/react/LexicalComposer';

import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';

import {ListItemNode, ListNode} from '@lexical/list'
import {HeadingNode} from '@lexical/rich-text'
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import { ReactNode } from 'react';

import {CustomLinkNode, validateUrl} from './Lexical/Link'
import CustomHashtagNode from './Lexical/Hashtag';
import { editorState } from './Lexical/Markdown';

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
    content: string
  }
  
  export default function Editor({ editable, content }:EditorProps) {
    const theme = {
    } 

    const initialConfig = {
      namespace: 'MyEditor',
      theme,
      onError,
      nodes: [
        ...CustomHashtagNode.nodes(),
        // ...CustomLinkNode.nodes(),
        HeadingNode, ListNode, ListItemNode],
      editable: editable,
      editorState: editorState(content),
    };


    return (
        <LexicalComposer initialConfig={initialConfig}>
          {/* <LinkPlugin validateUrl={validateUrl} /> */}
          <PlainTextPlugin
            contentEditable={<ContentEditable className="text" />}
            placeholder={<>...</>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HashtagPlugin />
        </LexicalComposer>
      );
  }

