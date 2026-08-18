import type { BuiltinNodeRenderer } from '@haklex/rich-compose'

type TableCellNode = {
  headerState?: number | boolean
  colSpan?: number
}

const TableRenderer: BuiltinNodeRenderer = (_node, key, children) => (
  <div
    className="rich-table-scroll my-5 w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
    key={key}
  >
    <table className="w-max min-w-full border-collapse [&_p]:my-1! [&_tr:last-child_td]:border-b-0">
      <tbody>{children}</tbody>
    </table>
  </div>
)

const TableRowRenderer: BuiltinNodeRenderer = (_node, key, children) => (
  <tr key={key}>{children}</tr>
)

const TableCellRenderer: BuiltinNodeRenderer = (node, key, children) => {
  const { headerState, colSpan } = node as TableCellNode
  const span = colSpan && colSpan > 1 ? colSpan : undefined
  if (headerState) {
    return (
      <th
        className="whitespace-nowrap border-b border-neutral-3 pr-4 pb-1.5 text-left align-bottom font-sans text-[0.82em] font-medium tracking-wider text-neutral-7"
        colSpan={span}
        key={key}
      >
        {children}
      </th>
    )
  }
  return (
    <td
      className="whitespace-nowrap border-b border-neutral-3/50 py-1.5 pr-4 align-top text-neutral-9"
      colSpan={span}
      key={key}
    >
      {children}
    </td>
  )
}

export const lexicalTableOverrides = {
  table: TableRenderer,
  tablerow: TableRowRenderer,
  tablecell: TableCellRenderer,
} satisfies Record<string, BuiltinNodeRenderer>
