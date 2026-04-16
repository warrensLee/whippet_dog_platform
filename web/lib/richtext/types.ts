import { Descendant } from 'slate'

export type CustomText = {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    foregroundColor?: string
    backgroundColor?: string
    text: string
}

export type ListItemElement = { type: 'list-item'; children: Descendant[], align?: string }

export type NumberedListItemElement = {
    type: 'numbered-list'
    align?: string
    children: Descendant[]
}

export type BulletedListElement = {
    type: 'bulleted-list'
    align?: string
    children: Descendant[]
}


export type HeadingElement = {
    type: 'heading-one'
    align?: string
    children: Descendant[]
}

export type HeadingTwoElement = {
    type: 'heading-two'
    align?: string
    children: Descendant[]
}

export type HeadingThreeElement = {
    type: 'heading-three'
    align?: string
    children: Descendant[]
}

export type TableElement = { type: 'table'; children: TableRowElement[], align?: string }

export type TableCellElement = { type: 'table-cell'; children: CustomText[], align?: string }

export type TableRowElement = { type: 'table-row'; children: TableCellElement[], align?: string }

export type ParagraphElement = {
    type: 'paragraph'
    align?: string
    children: Descendant[]
}


export type CustomElementWithAlign =
    | ParagraphElement
    | HeadingElement
    | HeadingTwoElement
    | HeadingThreeElement
    | BulletedListElement

export type CustomElement =
    | BulletedListElement
    | HeadingElement
    | HeadingTwoElement
    | HeadingThreeElement
    | NumberedListItemElement
    | ParagraphElement
    | TableElement
    | TableRowElement
    | TableCellElement
    | ListItemElement

export type CustomElementType = CustomElement['type']

declare module 'slate' {
    interface CustomTypes {
        Text: CustomText
        Element: CustomElement
    }
}