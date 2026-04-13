"use client"
import React, { useMemo, useCallback, ReactNode, useEffect } from "react";
import { createEditor, Editor, Node, Transforms, Element as SlateElement } from "slate";
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, useSlate } from "slate-react";
import { CustomElement, CustomElementType, CustomText } from "./types";
import { FormatAlignCenter, FormatAlignLeft, FormatAlignRight, FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered, FormatStrikethrough, FormatUnderlined, Title } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { renderElement, renderLeaf } from "./rendering";

type Props = {
    value: string;
    onChange: (value: string) => void;
    style: React.CSSProperties
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'] as const
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'] as const

const DEFAULT_TEXT = JSON.parse('[{ "type": "paragraph", "children": [{ "text": "" }] }]')
type AlignType = (typeof TEXT_ALIGN_TYPES)[number]
type ListType = (typeof LIST_TYPES)[number]

export default function RichTextEditor({ value, onChange, style = {} }: Props) {
    const editor = useMemo(() => withReact(createEditor()), []);
    const renderElementCallback = useCallback((props: RenderElementProps) => renderElement(props), []);
    const renderLeafCallback = useCallback((props: RenderLeafProps) => renderLeaf(props), []);
    let parsedValue = DEFAULT_TEXT
    try {
        parsedValue = JSON.parse(value)
    } catch { } //this catch is ignored because if the value is not parsed we default to DEFAULT_TEXT

    return (
        <div className="bg-white rounded-2xl border border-black/10" style={{ ...style, minHeight: "200px", display: "flex", flexDirection: "column" }}>
            <Slate key={value} editor={editor} initialValue={parsedValue} onChange={(e) => onChange(JSON.stringify(e))}>
                <div className="bg-gray-200 rounded-t-2xl">
                    <Tooltip title="Bold">
                        <span><ElementSelector mark="bold"><FormatBold /></ElementSelector></span>
                    </Tooltip>

                    <Tooltip title="Italic">
                        <span><ElementSelector mark="italic"><FormatItalic /></ElementSelector></span>
                    </Tooltip>

                    <Tooltip title="Underline">
                        <span><ElementSelector mark="underline"><FormatUnderlined /></ElementSelector></span>
                    </Tooltip>

                    <Tooltip title="Strikethrough">
                        <span><ElementSelector mark="strikethrough"><FormatStrikethrough /></ElementSelector></span>
                    </Tooltip>

                    <Tooltip title="Bulleted List">
                        <span><BlockButton format="bulleted-list" blockType="type"><FormatListBulleted /></BlockButton></span>
                    </Tooltip>

                    <Tooltip title="Numbered List">
                        <span><BlockButton format="numbered-list" blockType="type"><FormatListNumbered /></BlockButton></span>
                    </Tooltip>

                    <Tooltip title="Heading">
                        <span><BlockButton format="heading-one" blockType="type"><Title /></BlockButton></span>
                    </Tooltip>

                    <Tooltip title="Align Left">
                        <span><BlockButton format="left" blockType="align"><FormatAlignLeft /></BlockButton></span>
                    </Tooltip>

                    <Tooltip title="Align Center">
                        <span><BlockButton format="center" blockType="align"><FormatAlignCenter /></BlockButton></span>
                    </Tooltip>

                    <Tooltip title="Align Right">
                        <span><BlockButton format="right" blockType="align"><FormatAlignRight /></BlockButton></span>
                    </Tooltip>
                </div>
                <Editable style={{ flexGrow: "1" }} className="rounded-b-2xl"
                    renderElement={renderElementCallback}
                    renderLeaf={renderLeafCallback}
                    placeholder="Enter some text..."
                />
            </Slate>
        </div>
    );
};

const SELECTOR_CLASSNAME = " hover:bg-gray-700 m-2 p-2"

function ElementSelector({ children, mark }: { children: ReactNode, mark: keyof CustomText }) {
    const editor = useSlate();

    const isActive = () => {
        const marks = editor.getMarks();
        if (!marks) return false
        return marks[mark] === true;
    };

    const toggle = () => {
        const active = isActive();
        editor.addMark(mark, !active);
    };

    return (
        <button
            className={(isActive() ? "bg-gray-500" : "bg-gray-100") + " " + SELECTOR_CLASSNAME}
            onMouseDown={(e) => {
                e.preventDefault();
                toggle();
            }}
        >
            {children}
        </button>
    );
}

const isAlignElement = (
    element: CustomElement
): boolean => {
    return 'align' in element
}


function BlockButton({ format, blockType = 'type', children }: { format: CustomElementType, blockType: 'type', children: ReactNode } | { format: AlignType, blockType: 'align', children: ReactNode }) {
    const editor = useSlate()

    const isBlockActive = () => {
        const { selection } = editor
        if (!selection) return false

        const [match] = Array.from(
            Editor.nodes(editor, {
                at: Editor.unhangRange(editor, selection),
                match: n => {
                    if (Node.isElement(n)) {
                        if (blockType === 'align' && isAlignElement(n)) {
                            return n.align === format
                        }
                        return n.type === format
                    }
                    return false
                },
            })
        )

        return !!match
    }

    const toggleBlock = () => {
        const isActive = isBlockActive()
        const isList = LIST_TYPES.includes(format as ListType)

        Transforms.unwrapNodes(editor, {
            match: n => Node.isElement(n) && LIST_TYPES.includes(n.type as ListType) && !TEXT_ALIGN_TYPES.includes(format as AlignType),
            split: true,
        })
        const newProperties: Partial<SlateElement> = {}

        if (blockType === "type") {
            newProperties.type = isActive
                ? 'paragraph'
                : isList
                    ? 'list-item'
                    : format as CustomElementType
        }

        if (blockType === "align") {
            newProperties.align = isActive ? undefined : format
        }

        Transforms.setNodes(editor, newProperties)

        if (!isActive && isList) {
            const block = { type: format as CustomElementType, children: [] }
            Transforms.wrapNodes(editor, block)
        }
    }

    return (
        <button
            className={(isBlockActive() ? "bg-gray-500" : "bg-gray-100") + " " + SELECTOR_CLASSNAME}

            onMouseDown={(event) => {
                event.preventDefault()
                toggleBlock()
            }
            }
        >
            {children}
        </button>
    )
}