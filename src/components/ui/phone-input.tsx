
import * as React from "react"
import { Input } from "@/components/ui/input"

export type PhoneInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onChange?: (value: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      // Format phone number logic could go here
      onChange?.(value)
    }

    return (
      <Input
        type="tel"
        className={className}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
