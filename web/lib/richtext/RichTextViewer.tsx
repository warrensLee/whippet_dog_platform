import { useCallback, useMemo } from "react";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";
import { createEditor } from "slate"
import { renderElement, renderLeaf } from "./rendering";

export default function RichTextViewer({ text }: { text: string }) {

  const editor = useMemo(() => withReact(createEditor()), []);

  const renderElementCallback = useCallback((props: RenderElementProps) => renderElement(props), []);
  const renderLeafCallback = useCallback((props: RenderLeafProps) => renderLeaf(props), []);

  return (<div><Slate key={text} editor={editor} initialValue={
    (() => {
      try {
        return JSON.parse(text);
      } catch {
        return [
          {
            type: "paragraph",
            children: [{ text: text || "" }],
          },
        ];
      }
    })()
  } >
    <Editable readOnly renderElement={renderElementCallback} renderLeaf={renderLeafCallback} />
  </Slate></div>)
}