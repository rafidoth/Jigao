interface TogglerProps {
  state: boolean;
  onCheckedChange: () => void;
  activeClassName?: string;
  inActiveClassName?: string;
  children: React.ReactNode;
}

const Toggler = ({
  state,
  onCheckedChange,
  activeClassName = "flex gap-x-2 items-center justify-center rounded-lg border p-2 hover:bg-accent/30 hover:text-white cursor-pointer",
  inActiveClassName = "flex gap-x-2 items-center justify-center rounded-lg border p-2 bg-accent/10 text-blue-500 hover:bg-accent/30 hover:text-white cursor-pointer",
  children,
}: TogglerProps) => {
  if (state) {
    return (
      <span className={activeClassName} onClick={onCheckedChange}>
        {children}
      </span>
    );
  }
  return (
    <span className={inActiveClassName} onClick={onCheckedChange}>
      {children}
    </span>
  );
};

export default Toggler;
