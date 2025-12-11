// components/ui/checkbox.tsx
import React, { useState } from "react";

interface CheckboxProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  defaultChecked = false,
  onChange,
  className = "",
}) => {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className={`w-4 h-4 cursor-pointer accent-blue-500 ${className}`}
    />
  );
};
