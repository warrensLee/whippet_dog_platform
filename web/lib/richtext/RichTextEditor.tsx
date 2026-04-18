"use client"
import React, { useMemo, useCallback, ReactNode } from "react";
import { createEditor, Editor, Node, Transforms, Element as SlateElement } from "slate";
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, useSlate } from "slate-react";
import { CustomElement, CustomElementType, CustomText } from "./types";
import { FormatAlignCenter, FormatAlignLeft, FormatAlignRight, FormatBold, FormatColorFill, FormatColorText, FormatItalic, FormatListBulleted, FormatListNumbered, FormatStrikethrough, FormatUnderlined, Title } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { renderElement, renderLeaf } from "./rendering";

type Props = {
    value: string;
    onChange: (value: string) => void;
    style: React.CSSProperties
};

type ListType = typeof LIST_TYPES[number]

export default function RichTextEditor({ value, onChange, style = {} }: Props) {
    const editor = useMemo(() => withReact(createEditor()), []);
    const renderElementCallback = useCallback((props: RenderElementProps) => renderElement(props), []);
    const renderLeafCallback = useCallback((props: RenderLeafProps) => renderLeaf(props), []);
    const initialValue = useMemo(() => {
        if (!value) return [{ "type": "paragraph", "children": [{ "text": "" }] }];

        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [{ "type": "paragraph", "children": [{ "text": "" }] }];
        } catch {
            return [{ "type": "paragraph", "children": [{ "text": "" }] }];
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-black/10" style={{ ...style, minHeight: "200px", display: "flex", flexDirection: "column" }}>
            <Slate key={"slate"} editor={editor} initialValue={initialValue} onChange={(e) => onChange(JSON.stringify(e))}>
                <div className="bg-gray-200 rounded-t-2xl flex">
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
                        <span><HeadingSelector /></span>
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

                    <span><ColorPicker type="foreground" /></span>
                    <span><ColorPicker type="background" /></span>
                </div>
                <Editable style={{ flexGrow: "1" }} className="rounded-b-2xl"
                    renderElement={renderElementCallback}
                    renderLeaf={renderLeafCallback}
                //placeholder="Enter some text..."
                />
            </Slate>
        </div>
    );
};

const SELECTOR_CLASSNAME = " hover:bg-gray-700 m-2 p-2"

function ElementSelector({ children, mark }: { children: ReactNode, mark: keyof Omit<CustomText, "text"> }) {
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
        <button type="button"
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

function HeadingSelector() {
    const editor = useSlate();
    const [isOpen, setIsOpen] = React.useState(false);

    const currentType = () => {
        const { selection } = editor;
        if (!selection) return 'paragraph';

        const [match] = Array.from(
            Editor.nodes(editor, {
                at: Editor.unhangRange(editor, selection),
                match: n => Node.isElement(n) && ['paragraph', 'heading-one', 'heading-two', 'heading-three'].includes(n.type)
            })
        );
        if (!match) return "paragraph"
        return (match[0] as CustomElement).type
    };

    const toggleHeading = (type: CustomElementType) => {
        Transforms.setNodes(editor, { type }, { match: n => Node.isElement(n) && ['paragraph', 'heading-one', 'heading-two', 'heading-three'].includes(n.type as string) });
        setIsOpen(false);
    };

    const types = [
        { type: 'paragraph', label: 'Paragraph' },
        { type: 'heading-one', label: 'Heading 1' },
        { type: 'heading-two', label: 'Heading 2' },
        { type: 'heading-three', label: 'Heading 3' }
    ];

    const activeType = currentType();

    return (
        <div className="relative">
            <button type="button"
                className={"bg-gray-100 hover:bg-gray-700 flex items-center" + SELECTOR_CLASSNAME}
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <Title />
                <span className="ml-1 text-sm uppercase">{activeType.replace('-', ' ')}</span>
            </button>

            {isOpen && (
                <div className="absolute bg-white border border-gray-300 rounded shadow-lg py-1 z-50 mt-2 mr-2 min-w-[150px]">
                    {types.map((t) => (
                        <button type="button"
                            key={t.type}
                            onClick={(event) => {
                                event.preventDefault();
                                toggleHeading(t.type as CustomElementType);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-200 ${activeType === t.type ? 'bg-gray-100 font-semibold' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'] as const

function BlockButton({ format, blockType = 'type', children }: { format: CustomElementType, blockType: 'type', children: ReactNode } | { format: 'left' | 'center' | 'right', blockType: 'align', children: ReactNode }) {
    const editor = useSlate()

    const isBlockActive = () => {
        const { selection } = editor
        if (!selection) return false

        const [match] = Array.from(
            Editor.nodes(editor, {
                at: Editor.unhangRange(editor, selection),
                match: n => {
                    if (Node.isElement(n)) {
                        if (blockType === 'align') {
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
            match: n => Node.isElement(n) && LIST_TYPES.includes(n.type as ListType),
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
        <button type="button"
            className={(isBlockActive() ? "bg-gray-500" : "bg-gray-100") + " " + SELECTOR_CLASSNAME}

            onClick={(event) => {
                event.preventDefault()
                toggleBlock()
            }
            }
        >
            {children}
        </button>
    )
}

function ColorPicker({ type }: { type: "foreground" | "background" }) {
    const editor = useSlate();
    const [isOpen, setIsOpen] = React.useState(false);

    const colors = [
        "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3",
        "#000000", "#FFFFFF"
    ];

    const getColor = () => {
        const mark = type === "foreground" ? "foregroundColor" : "backgroundColor";
        const marks = editor.getMarks();
        return marks?.[mark] as string || (type === "foreground" ? "#FFFFFF" : "#000000");
    };

    const handleColorChange = (color: string) => {
        const mark = type === "foreground" ? "foregroundColor" : "backgroundColor";
        editor.addMark(mark, color);
        setIsOpen(false);
    };

    const currentColor = getColor();

    return (
        <div>
            <button type="button"
                className={"bg-gray-100 hover:bg-gray-700 flex" + SELECTOR_CLASSNAME}
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <div
                    className={`w-6 h-6 rounded border`} style={{ backgroundColor: currentColor }}>
                </div>
                {type === "foreground" ? <FormatColorText /> : <FormatColorFill />}
            </button>

            {
                isOpen && (
                    <div className="absolute bg-white border border-gray-300 rounded shadow-lg p-2 z-50 ml-2 mr-2">
                        <div className="grid grid-rows-3">
                            {colors.map((color) => (
                                <button type="button"
                                    key={color}
                                    onClick={(event) => {
                                        event.preventDefault()
                                        handleColorChange(color)
                                    }}
                                    className={`w-6 h-6 rounded border ${currentColor === color ? 'border-2 border-blue-500' : 'border-gray-300'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}