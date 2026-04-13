import { createEffect, createMemo, createSignal } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode } from '@types'
import { flattenWithBreadcrumb, getVisibleNodes } from './categoryTreeSelectDialogUtils'

export function useCategoryTreeSelectDialog(props: {
  open: () => boolean
  onSelect: (value: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const [search, setSearch] = createSignal('')
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const [highlight, setHighlight] = createSignal(0)

  let listRef: HTMLDivElement | undefined
  const setListRef = (el: HTMLDivElement) => {
    listRef = el
  }

  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
    () => props.open(),
  )

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const categoryData = extractBudgetCategoriesData(raw)
    if (!categoryData || typeof categoryData !== 'object') return [] as CategoryNode[]
    return convertToTree(categoryData)
  })

  createEffect(() => {
    const nodes = tree()
    if (nodes.length > 0 && expanded().size === 0) {
      setExpanded(new Set(nodes.map((n) => n.value)))
    }
  })

  const allFlat = createMemo(() => flattenWithBreadcrumb(tree()))

  const searchResults = createMemo(() => {
    const query = search().trim().toLowerCase()
    if (!query) return null
    return allFlat().filter(({ node }) => node.label.toLowerCase().includes(query))
  })

  const navigableItems = createMemo(() => {
    const results = searchResults()
    if (results !== null) {
      return results.map(({ node }) => node)
    }
    return getVisibleNodes(tree(), expanded())
  })

  const treeNavIndexByValue = createMemo(() => {
    const items = navigableItems()
    const m = new Map<string, number>()
    for (let i = 0; i < items.length; i++) {
      m.set(items[i].value, i)
    }
    return m
  })

  createEffect(() => {
    navigableItems()
    setHighlight(0)
  })

  function scrollHighlightIntoView() {
    if (!listRef) return
    const el = listRef.querySelector(`[data-highlight="true"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }

  function toggleExpand(value: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function handleSelect(value: string) {
    props.onSelect(value)
    props.onOpenChange(false)
    setSearch('')
  }

  function handleKeyDown(e: KeyboardEvent) {
    const items = navigableItems()
    if (!items.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(i + 1, items.length - 1))
      queueMicrotask(scrollHighlightIntoView)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(i - 1, 0))
      queueMicrotask(scrollHighlightIntoView)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[highlight()]
      if (!item) return
      handleSelect(item.value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      props.onOpenChange(false)
      setSearch('')
    }
  }

  return {
    search,
    setSearch,
    expanded,
    highlight,
    setHighlight,
    setListRef,
    q,
    tree,
    searchResults,
    navigableItems,
    treeNavIndexByValue,
    toggleExpand,
    handleSelect,
    handleKeyDown,
  }
}
