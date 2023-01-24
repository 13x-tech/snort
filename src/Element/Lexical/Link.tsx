import { FileExtensionRegex } from 'Const';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { hexToBech32 } from 'Util';

const URL_MATCHER =
        /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;




export const LINK_MATCHERS = (tags?: Array<Tag>, users?: Map<string, MetadataCache>) => [
  (text:string) => {
      const match = URL_MATCHER.exec(text);
      if (match === null) {
      return null;
      }
      const fullMatch = match[0];
      try {
        const url = new URL(fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`)
        const extension = FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;
        switch(extension) {
          case "gif":
          case "jpg":
          case "jpeg":
          case "png":
          case "bmp":
          case "webp": {
            return {
              image: true,
              index: match.index,
              length: fullMatch.length,
              text: fullMatch,
              url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
              attributes: { rel: 'noopener', target: '_blank' }, 
            };
          }
          case "mp4":
          case "mov":
          case "mkv":
          case "avi":
          case "m4v": {
              return {
                video: true,
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                attributes: { rel: 'noopener', target: '_blank' }, 
              };
          }
          default: {
            return {
              index: match.index,
              length: fullMatch.length,
              text: fullMatch,
              url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
              attributes: { rel: 'noopener', target: '_blank' }, 
            };
          }
        }
      }catch(error) {
        return null
      }
  },
  (text:string) => {
    interface response {
        [key:string]: any
    }

    const match = text.match(/#\[(\d+)\]/);
    if(match === null) {
        return null;
    }
    const fullMatch = match[0];

    let matchMention:response = {
        index: match.index,
        length: fullMatch.length,
        text: fullMatch, 
    }

    const idx = parseInt(match[1]);
    const ref = tags?.find(a => a.Index === idx);
    if(ref) {
        matchMention.key = ref.Key
        switch(ref.Key) {
            case "p":
                matchMention.pubKey = ref.PubKey;
                break;
            case "e": {
                matchMention.eText = hexToBech32("note", ref.Event!).substring(0, 12);
                matchMention.Event = ref.Event;
                break;
            }
             case "t":
                matchMention.Hashtag = ref.Hashtag
        }
    }

    return matchMention
  }
];
