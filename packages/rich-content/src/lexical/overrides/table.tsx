import { sx, sxClass } from '../../lib/sx'
import { atoms } from '../../styles/atoms.stylex'
import type { BuiltinNodeRenderer } from '@haklex/rich-compose'

type TableCellNode = {
  headerState?: number | boolean
  colSpan?: number
}

const TableRenderer: BuiltinNodeRenderer = (_node, key, children) => (
  <div
    {...sxClass("rich-table-scroll", atoms.my_5, atoms.w_full, atoms.min_w_0, atoms.overflow_x_auto, atoms.overscroll_x_contain, atoms.__webkit_overflow_scrolling_touch)}
    key={key}
  >
    <table {...sx(atoms.w_max, atoms.min_w_full, atoms.border_collapse, atoms._and_p_my_1important_, atoms._and_tr_last_child_td_border_b_0)}>
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
        {...sx(atoms.whitespace_nowrap, atoms.border_b, atoms.border_neutral_3, atoms.pr_4, atoms.pb_1dot5, atoms.text_left, atoms.align_bottom, atoms.font_sans, atoms.text__0dot82em, atoms.font_medium, atoms.tracking_wider, atoms.text_neutral_7)}
        colSpan={span}
        key={key}
      >
        {children}
      </th>
    )
  }
  return (
    <td
      {...sx(atoms.whitespace_nowrap, atoms.border_b, atoms.border_neutral_3_50, atoms.py_1dot5, atoms.pr_4, atoms.align_top, atoms.text_neutral_9)}
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
