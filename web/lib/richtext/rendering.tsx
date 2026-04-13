import { RenderElementProps, RenderLeafProps } from "slate-react"

export function renderElement(props: RenderElementProps) {
    const justify = "text-" + (props.element.align || "left")
    if (props.element.type == "bulleted-list") {
        return <ul {...props.attributes} className={justify + " list-disc list-inside"
        }>{props.children}</ul>
    } else if (props.element.type == "numbered-list") {
        return <ol {...props.attributes} className={justify + " list-decimal list-inside"
        }>{props.children}</ol>
    } else if (props.element.type == "heading-one") {
        return <p {...props.attributes} className={"text-2xl " + justify}>{props.children}</p>
    } else if (props.element.type == "heading-two") {
        return <p {...props.attributes} className={"text-xl " + justify}>{props.children}</p>
    } else if (props.element.type == "heading-threes") {
        return <p {...props.attributes} className={"text-l " + justify}>{props.children}</p>
    } else if (props.element.type == "list-item") {
        return <li {...props.attributes} className={justify}><p className="m-0 inline">{props.children}</p></li >
    }
    return <p {...props.attributes} className={justify}>{props.children}</p>;
}

export function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }
    if (leaf.italic) {
        children = <em>{children}</em>
    }
    if (leaf.underline) {
        children = <u>{children}</u>
    }
    if (leaf.strikethrough) {
        children = <s>{children}</s>
    }
    return <span {...attributes}>{children}</span>
}