interface CategoryChipProps {
  label: string
  active?: boolean
  onClick: () => void
}

const CategoryChip = ({ label, active = false, onClick }: CategoryChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center rounded-pill px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:focus-visible:outline-forest-400 ${
        active
          ? 'bg-forest text-white hover:bg-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500'
          : 'bg-sand-100 text-ink-700 hover:bg-sand-200 dark:bg-white/10 dark:text-ink-200 dark:hover:bg-white/15'
      }`}
    >
      {label}
    </button>
  )
}

export default CategoryChip
