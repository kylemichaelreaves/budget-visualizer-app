import type { Accessor, JSX } from 'solid-js'
import { createSignal } from 'solid-js'
import BudgetCategoryTreeSelect from '@components/shared/BudgetCategoryTreeSelect'

export default function AssignCategoryDialog(props: {
  open: Accessor<boolean>
  currentCategory: string | null | undefined
  itemName: string | undefined
  onSave: (category: string) => void
  onClose: () => void
}): JSX.Element {
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null)

  function handleSelect(value: string) {
    console.log('[AssignDialog] handleSelect:', value)
    setSelectedCategory(value)
    props.onSave(value)
    props.onClose()
    setSelectedCategory(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      props.onClose()
      setSelectedCategory(null)
    }
  }

  const description = () => {
    const name = props.itemName
    return name ? `Select a category for ${name}` : undefined
  }

  return (
    <BudgetCategoryTreeSelect
      open={props.open}
      onOpenChange={handleOpenChange}
      value={selectedCategory() ?? props.currentCategory ?? null}
      onSelect={handleSelect}
      title="Assign Budget Category"
      description={description()}
    />
  )
}
