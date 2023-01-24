import {
  $convertFromMarkdownString,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  STRIKETHROUGH,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  QUOTE,
  CHECK_LIST,
  CODE,
  HEADING,
  LINK,
} from '@lexical/markdown';

export const editorState = (content: string) => () => {
  $convertFromMarkdownString(content, [
    INLINE_CODE,
    BOLD_ITALIC_STAR,
    BOLD_ITALIC_UNDERSCORE,
    BOLD_STAR,
    BOLD_UNDERSCORE,
    STRIKETHROUGH,
    ITALIC_STAR,
    ITALIC_UNDERSCORE,
    ORDERED_LIST,
    QUOTE,
    CHECK_LIST,
    CODE,
    HEADING,
    LINK,
  ])
}