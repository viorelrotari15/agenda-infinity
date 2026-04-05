import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  const { className = '', ...rest } = props;
  return <input ref={ref} className={`ui-input ${className}`.trim()} {...rest} />;
});
