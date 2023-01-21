import type { AutoEmbedOption } from '@lexical/react/LexicalAutoEmbedPlugin';
import type { MenuRenderFn } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useState } from 'react'

const PreviewMenu: MenuRenderFn<AutoEmbedOption> = (anchorElementRef, {
    selectedIndex, options, selectOptionAndCleanUp, setHighlightedIndex
}) => {
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
   
    return (
        <div style={{ zIndex: 10 }}>
            <ul className='flex max-w-[312px] flex-col gap-1 overflow-hidden rounded bg-bg-main p-1 text-sm shadow-md'>
                {options.map((option, idx) => (
                    <li
                        role='option'
                        aria-selected={selectedIndex === idx}
                        key={option.key}
                        onKeyDown={(e) => {
                            if (e.key == 'Enter') {
                                setHighlightedIndex(idx)
                                selectOptionAndCleanUp(option)
                            }
                        }}
                        onMouseEnter={() => {
                            setHighlightedIndex(idx)
                        }}
                        onClick={() => {
                            setHighlightedIndex(idx)
                            selectOptionAndCleanUp(option)
                        }}
                    >{option.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default PreviewMenu;