import { Radio } from '@base-ui/react/radio'
import type * as React from 'react'
import { buttonVariants } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

type Option<Value> = { value: Value; label: React.ReactNode }

type RadioButtonGroupProps<Value extends string | number> = {
  value: Value
  onValueChange: (value: Value) => void
  options: readonly Option<Value>[]
  'aria-label': string
  className?: string
}

/** ラジオ(`role=radio`)のまま、見た目だけボタンにした選択肢。選ばれているものは塗りつぶす。 */
export function RadioButtonGroup<Value extends string | number>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: RadioButtonGroupProps<Value>) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onValueChange(next as Value)}
      aria-label={props['aria-label']}
      className={cn('flex w-auto gap-1', className)}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'flex-1 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:hover:bg-primary',
          )}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}
